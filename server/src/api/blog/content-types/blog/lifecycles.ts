import generateSlug from "../../../../helpers/generateSlug";
import locales from '../../../../../config/locales';
import { blogTranslater } from '../../../../helpers/translateHelper';

const targetLocales = locales.targetLocales;

const requiredFields = ['isArchive', 'isFeatured', 'tag', 'images', 'attachments'];

let isHookRunning = false;

async function safeBlogTranslate(event) {
  if (isHookRunning) return;

  isHookRunning = true;
  await blogTranslater(event, targetLocales, requiredFields);
  isHookRunning = false;
}


export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event);
  },
  async afterCreate(event) {
    return safeBlogTranslate(event);
  },


  async afterUpdate(event) {
    return safeBlogTranslate(event);
  }
};