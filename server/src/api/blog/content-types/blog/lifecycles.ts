import generateSlug from "../../../../helpers/generateSlug";
import locales from '../../../../../config/locales';
import { blogTranslater } from '../../../../helpers/translateHelper';

const targetLocales = locales.targetLocales;

const requiredFields = ['isArchive', 'isFeatured', 'tag', 'images', 'attachments'];

export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event);
  },
  async afterCreate(event) {
    await blogTranslater(event, targetLocales, requiredFields);
  },
  // async afterUpdate(event) {
  //   await blogTranslater(event, targetLocales, requiredFields);
  // }
};
