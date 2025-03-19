import generateSlug from "../../../../helpers/generateSlug";
import locales from '../../../../../config/locales';
import { translateHelper } from '../../../../helpers/translateHelper';

const targetLocales = locales.targetLocales; 
const fieldsToTranslate = ['about', 'fullName'];
const requiredFields = ['email'];



export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event);
  },
  async afterCreate(event) {
      await translateHelper(event, targetLocales, fieldsToTranslate, requiredFields);
  },
  async afterUpdate(event) {
      await translateHelper(event, targetLocales, fieldsToTranslate, requiredFields);        
  }
};
