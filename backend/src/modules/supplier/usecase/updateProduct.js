const { uploadDataUrl, deleteImageByUrl } = require('../../../utils/cloudinary');

function normalizeStatus(status) {
  if (!status) {
    return 'draft';
  }

  const normalized = String(status).toLowerCase();
  if (normalized === 'published' || normalized === 'active') {
    return 'active';
  }
  return normalized;
}

function buildSlug(name, currentSlug) {
  if (!name) {
    return currentSlug;
  }
  return `${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;
}

function normalizeImageInput(image) {
  if (typeof image === 'string') {
    return { imageUrl: image };
  }

  return {
    imageUrl: image.imageUrl || image.url || image.dataUrl || image.fileData || null,
    displayOrder: Number(image.displayOrder ?? image.order ?? 0),
    isPrimary: !!image.isPrimary
  };
}

async function uploadProductImage(image, index) {
  const normalized = normalizeImageInput(image);
  if (!normalized.imageUrl) {
    throw new Error(`Image ${index + 1} is missing a URL or data payload`);
  }

  if (String(normalized.imageUrl).startsWith('data:')) {
    const uploaded = await uploadDataUrl(normalized.imageUrl, { folder: 'vfabrica/products' });
    return {
      imageUrl: uploaded.url,
      publicId: uploaded.publicId,
      displayOrder: normalized.displayOrder ?? index,
      isPrimary: normalized.isPrimary || index === 0
    };
  }

  return {
    imageUrl: normalized.imageUrl,
    displayOrder: normalized.displayOrder ?? index,
    isPrimary: normalized.isPrimary || index === 0
  };
}

async function persistVariantAttributes(sequelize, createProductAttributeValue, transaction, variantId, attributes = []) {
  for (const attribute of attributes) {
    if (!attribute || !attribute.attributeId || attribute.value === undefined || attribute.value === null || attribute.value === '') {
      continue;
    }
    await createProductAttributeValue(sequelize, {
      productVariantId: variantId,
      attributeId: attribute.attributeId,
      value: String(attribute.value)
    }, transaction);
  }
}

/**
 * Factory for updating a supplier product.
 */
module.exports = function makeUpdateProduct({
  sequelize,
  getSupplierByUserId,
  updateProduct,
  deleteProductImages,
  createProductImage,
  deleteProductVariants,
  createProductVariant,
  createProductAttributeValue,
  deleteProductAttributeValuesByVariantId,
  getSupplierProductById,
  getProductImageById,
  getProductVariantById,
  updateProductVariant,
  deleteProductVariantById,
  updateProductStatus
}) {
  return async function handleUpdateProduct(userId, productId, {
    categoryId,
    fabricTypeId,
    unitId,
    brand,
    name,
    description,
    basePrice,
    minimumOrderQuantity,
    leadTimeDays,
    status,
    images,
    variants
  }) {
    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const transaction = await sequelize.transaction();
    const uploadedImages = [];

    try {
      const currentResult = await sequelize.query(
        `SELECT * FROM "products" WHERE "id" = :productId AND "supplier_id" = :supplierId AND "is_deleted" = FALSE LIMIT 1;`,
        {
          replacements: { productId, supplierId: profile.id },
          type: 'SELECT',
          transaction
        }
      );
      const current = currentResult[0];
      if (!current) {
        throw new Error('Product not found or not owned by supplier');
      }

      const nextStatus = status ? normalizeStatus(status) : current.status;
      const nextSlug = buildSlug(name, current.slug);
      const nextCategoryId = categoryId !== undefined ? categoryId : current.category_id;
      const nextFabricTypeId = fabricTypeId !== undefined ? fabricTypeId : current.fabric_type_id;
      const nextUnitId = unitId !== undefined ? unitId : current.unit_id;
      const nextBrand = brand !== undefined ? brand : current.brand;
      const nextName = name || current.name;
      const nextDescription = description !== undefined ? description : current.description;
      const nextBasePrice = basePrice !== undefined ? Number(basePrice) : Number(current.base_price);
      const nextMoq = minimumOrderQuantity !== undefined ? Number(minimumOrderQuantity) : Number(current.minimum_order_quantity);
      const nextLeadTimeDays = leadTimeDays !== undefined ? Number(leadTimeDays) : Number(current.lead_time_days);

      if (Number.isNaN(nextBasePrice) || nextBasePrice < 0) {
        throw new Error('Base price must be zero or greater');
      }
      if (Number.isNaN(nextMoq) || nextMoq < 0) {
        throw new Error('Minimum order quantity must be zero or greater');
      }

      const updated = await updateProduct(sequelize, {
        productId,
        categoryId: nextCategoryId,
        fabricTypeId: nextFabricTypeId,
        unitId: nextUnitId,
        brand: nextBrand,
        name: nextName,
        slug: nextSlug,
        description: nextDescription,
        basePrice: nextBasePrice,
        minimumOrderQuantity: nextMoq,
        leadTimeDays: Number.isNaN(nextLeadTimeDays) ? current.lead_time_days : nextLeadTimeDays,
        status: nextStatus
      }, transaction);

      if (Array.isArray(images)) {
        const existingImages = await sequelize.query(
          `SELECT * FROM "product_images" WHERE "product_id" = :productId ORDER BY "display_order" ASC;`,
          { replacements: { productId }, type: 'SELECT', transaction }
        );

        const existingImagesById = new Map((existingImages || []).map(image => [image.id, image]));
        await deleteProductImages(sequelize, productId, transaction);

        for (let index = 0; index < images.length; index += 1) {
          const preparedImage = await uploadProductImage(images[index], index);
          const img = await createProductImage(sequelize, {
            productId,
            imageUrl: preparedImage.imageUrl,
            displayOrder: preparedImage.displayOrder,
            isPrimary: preparedImage.isPrimary
          }, transaction);
          uploadedImages.push(preparedImage);
          if (preparedImage.imageUrl && existingImagesById.size > 0) {
            // keep only in-memory tracking for cleanup on rollback
          }
          void img;
        }
      }

      if (Array.isArray(variants)) {
        const existingVariants = await sequelize.query(
          `SELECT * FROM "product_variants" WHERE "product_id" = :productId;`,
          { replacements: { productId }, type: 'SELECT', transaction }
        );

        const handledVariantIds = new Set();

        for (const variant of variants) {
          const skuInput = variant.sku && String(variant.sku).trim();
          const targetSizeId = variant.sizeId || null;
          const targetColorId = variant.colorId || null;

          // Match existing variant by explicit ID, SKU, or matching (sizeId + colorId)
          let existingVar = null;
          if (variant.id) {
            existingVar = existingVariants.find(ev => ev.id === variant.id && !handledVariantIds.has(ev.id));
          }
          if (!existingVar && skuInput) {
            existingVar = existingVariants.find(ev => ev.sku === skuInput && !handledVariantIds.has(ev.id));
          }
          if (!existingVar) {
            existingVar = existingVariants.find(ev =>
              !handledVariantIds.has(ev.id) &&
              (ev.size_id === targetSizeId || (!ev.size_id && !targetSizeId)) &&
              (ev.color_id === targetColorId || (!ev.color_id && !targetColorId))
            );
          }

          if (existingVar) {
            handledVariantIds.add(existingVar.id);
            const finalSku = skuInput || existingVar.sku;

            if (finalSku && finalSku !== existingVar.sku) {
              const duplicateSku = await sequelize.query(
                `SELECT id FROM "product_variants" WHERE "sku" = :sku AND "id" != :existingId LIMIT 1;`,
                { replacements: { sku: finalSku, existingId: existingVar.id }, type: 'SELECT', transaction }
              );
              if (duplicateSku[0]) {
                throw new Error(`Duplicate SKU detected: ${finalSku}`);
              }
            }

            await updateProductVariant(sequelize, {
              variantId: existingVar.id,
              sizeId: targetSizeId,
              colorId: targetColorId,
              sku: finalSku,
              price: Number(variant.price ?? nextBasePrice),
              status: normalizeStatus(variant.status || nextStatus)
            }, transaction);

            await deleteProductAttributeValuesByVariantId(sequelize, existingVar.id, transaction);
            if (Array.isArray(variant.attributes) && variant.attributes.length > 0) {
              await persistVariantAttributes(sequelize, createProductAttributeValue, transaction, existingVar.id, variant.attributes);
            }
          } else {
            const finalSku = skuInput || `${nextSlug}-${Math.random().toString(36).substring(2, 7)}`;
            const duplicateSku = await sequelize.query(
              `SELECT id FROM "product_variants" WHERE "sku" = :sku LIMIT 1;`,
              { replacements: { sku: finalSku }, type: 'SELECT', transaction }
            );
            if (duplicateSku[0]) {
              throw new Error(`Duplicate SKU detected: ${finalSku}`);
            }

            const createdVariant = await createProductVariant(sequelize, {
              productId,
              sizeId: targetSizeId,
              colorId: targetColorId,
              sku: finalSku,
              price: Number(variant.price ?? nextBasePrice),
              status: normalizeStatus(variant.status || nextStatus)
            }, transaction);

            if (Array.isArray(variant.attributes) && variant.attributes.length > 0) {
              await persistVariantAttributes(sequelize, createProductAttributeValue, transaction, createdVariant.id, variant.attributes);
            }
          }
        }

        // Safely inactivate or delete removed variants that are not present in update payload
        for (const unhandled of existingVariants) {
          if (!handledVariantIds.has(unhandled.id)) {
            const orderRef = await sequelize.query(
              `SELECT id FROM "order_items" WHERE "product_variant_id" = :variantId LIMIT 1;`,
              { replacements: { variantId: unhandled.id }, type: 'SELECT', transaction }
            );

            if (orderRef && orderRef[0]) {
              await updateProductVariant(sequelize, {
                variantId: unhandled.id,
                sizeId: unhandled.size_id,
                colorId: unhandled.color_id,
                sku: unhandled.sku,
                price: unhandled.price,
                status: 'inactive'
              }, transaction);
            } else {
              try {
                await deleteProductAttributeValuesByVariantId(sequelize, unhandled.id, transaction);
                await sequelize.query(
                  `DELETE FROM "product_variants" WHERE "id" = :variantId;`,
                  { replacements: { variantId: unhandled.id }, type: 'DELETE', transaction }
                );
              } catch {
                await updateProductVariant(sequelize, {
                  variantId: unhandled.id,
                  sizeId: unhandled.size_id,
                  colorId: unhandled.color_id,
                  sku: unhandled.sku,
                  price: unhandled.price,
                  status: 'inactive'
                }, transaction);
              }
            }
          }
        }
      }

      await transaction.commit();
      const persisted = await getSupplierProductById(sequelize, { supplierId: profile.id, productId: updated.id });
      const imagesResult = await sequelize.query(
        `SELECT * FROM "product_images" WHERE "product_id" = :productId ORDER BY "display_order" ASC;`,
        { replacements: { productId: updated.id }, type: 'SELECT' }
      );
      const variantsResult = await sequelize.query(
        `SELECT pv.*, ps."name" as "size_name", ps."width", ps."length", c."name" as "color_name", c."hex_code"
         FROM "product_variants" pv
         LEFT JOIN "product_sizes" ps ON pv."size_id" = ps."id"
         LEFT JOIN "colors" c ON pv."color_id" = c."id"
         WHERE pv."product_id" = :productId
         ORDER BY pv."created_at" ASC;`,
        { replacements: { productId: updated.id }, type: 'SELECT' }
      );

      return {
        ...persisted,
        images: imagesResult,
        variants: variantsResult
      };
    } catch (error) {
      await transaction.rollback();

      for (const image of uploadedImages) {
        try {
          await deleteImageByUrl(image.imageUrl || image.url);
        } catch {
          // Ignore cleanup failures so the original error is surfaced.
        }
      }

      throw error;
    }
  };
};
