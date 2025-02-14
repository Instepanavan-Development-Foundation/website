import generateSlug from "../../../../helpers/generateSlug";

export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event, "fullName");
  },
};
