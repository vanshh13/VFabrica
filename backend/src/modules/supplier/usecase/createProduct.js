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

function buildSlug(name) {
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
 * Factory for creating a supplier product.
 */
module.exports = function makeCreateProduct({
  sequelize,
  getSupplierByUserId,
  createProduct,
  createProductImage,
  createProductVariant,
  createProductAttributeValue,
  getSupplierProductById
}) {
  return async function handleCreateProduct(userId, {
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
    variants = []
  }) {
    if (!name) {
      throw new Error('Product name is required');
    }

    const priceValue = Number(basePrice);
    const moqValue = Number(minimumOrderQuantity);
    const leadTimeValue = Number(leadTimeDays);

    if (Number.isNaN(priceValue) || priceValue < 0) {
      throw new Error('Base price must be zero or greater');
    }
    if (Number.isNaN(moqValue) || moqValue < 0) {
      throw new Error('Minimum order quantity must be zero or greater');
    }

    const profile = await getSupplierByUserId(sequelize, userId);
    if (!profile) {
      throw new Error('Supplier profile not found');
    }

    const transaction = await sequelize.transaction();
    const uploadedImages = [];

    try {
      const categoryCheck = categoryId ? await sequelize.query(
        `SELECT id FROM "categories" WHERE "id" = :categoryId AND "is_deleted" = FALSE LIMIT 1;`,
        { replacements: { categoryId }, type: 'SELECT', transaction }
      ) : [];

      if (categoryId && (!categoryCheck[0] || !categoryCheck[0].id)) {
        throw new Error('Category does not exist');
      }

      const slug = buildSlug(name);
      const product = await createProduct(sequelize, {
        supplierId: profile.id,
        categoryId: categoryId || null,
        fabricTypeId: fabricTypeId || null,
        unitId: unitId || null,
        brand: brand || null,
        name,
        slug,
        description,
        basePrice: priceValue,
        minimumOrderQuantity: moqValue,
        leadTimeDays: Number.isNaN(leadTimeValue) ? 3 : leadTimeValue,
        status: normalizeStatus(status)
      }, transaction);

      const savedImages = [];
      if (Array.isArray(images) && images.length > 0) {
        for (let index = 0; index < images.length; index += 1) {
          const preparedImage = await uploadProductImage(images[index], index);
          const img = await createProductImage(sequelize, {
            productId: product.id,
            imageUrl: preparedImage.imageUrl,
            displayOrder: preparedImage.displayOrder,
            isPrimary: preparedImage.isPrimary
          }, transaction);
          uploadedImages.push(preparedImage);
          savedImages.push(img);
        }
      }

      const savedVariants = [];
      for (const variant of variants) {
        const sku = variant.sku && String(variant.sku).trim();
        if (sku) {
          const duplicateSku = await sequelize.query(
            `SELECT id FROM "product_variants" WHERE "sku" = :sku LIMIT 1;`,
            { replacements: { sku }, type: 'SELECT', transaction }
          );
          if (duplicateSku[0]) {
            throw new Error(`Duplicate SKU detected: ${sku}`);
          }
        }

        const createdVariant = await createProductVariant(sequelize, {
          productId: product.id,
          sizeId: variant.sizeId || null,
          colorId: variant.colorId || null,
          sku: sku || `${slug}-${Math.random().toString(36).substring(2, 7)}`,
          price: Number(variant.price ?? priceValue),
          status: normalizeStatus(variant.status)
        }, transaction);

        if (Array.isArray(variant.attributes) && variant.attributes.length > 0) {
          await persistVariantAttributes(sequelize, createProductAttributeValue, transaction, createdVariant.id, variant.attributes);
        }

        savedVariants.push(createdVariant);
      }

      await transaction.commit();
      const persisted = await getSupplierProductById(sequelize, { supplierId: profile.id, productId: product.id });

      return {
        ...persisted,
        images: savedImages,
        variants: savedVariants
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
