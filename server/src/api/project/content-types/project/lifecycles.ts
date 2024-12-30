export default {
  beforeCreate(event) {
    const { id, slug } = event.params.data;

    event.params.data.slug = slug ? slug : id;
  },
  beforeUpdate(event) {
    const { slug } = event.params.data;
    const { id } = event.params.where;

    event.params.data.slug = slug ? slug : id;
  },
};
