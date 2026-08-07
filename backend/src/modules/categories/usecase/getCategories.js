/**
 * Factory for getting hierarchical categories list.
 */
module.exports = function makeGetCategories({ sequelize, getAllCategories }) {
  return async function getCategories() {
    const list = await getAllCategories(sequelize);
    
    const tree = [];
    const lookup = {};

    list.forEach(item => {
      lookup[item.id] = { ...item, children: [] };
    });

    list.forEach(item => {
      if (item.parent_id) {
        if (lookup[item.parent_id]) {
          lookup[item.parent_id].children.push(lookup[item.id]);
        } else {
          tree.push(lookup[item.id]);
        }
      } else {
        tree.push(lookup[item.id]);
      }
    });

    return tree;
  };
};
