import strapiService from "./strapi";
import bankingService from "./banking";

export default () => ({
  ...bankingService,
  ...strapiService,
});
