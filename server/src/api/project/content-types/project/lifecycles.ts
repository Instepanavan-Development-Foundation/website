import generateSlug from "../../../../helpers/generateSlug";
import locales from '../../../../../config/locales';
import { translateHelper } from '../../../../helpers/translateHelper';

const targetLocales = locales.targetLocales;
const fieldsToTranslate = ['name', 'description', 'about'];

export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event);
  },
  // async afterCreate(event) {
  //   await translateHelper(event, targetLocales, fieldsToTranslate);
  // },
  // async afterUpdate(event) {
  //   await translateHelper(event, targetLocales, fieldsToTranslate);
  // }
};
