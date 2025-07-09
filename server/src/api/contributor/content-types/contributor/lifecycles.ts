import generateSlug from "../../../../helpers/generateSlug";
import locales from '../../../../../config/locales';
import { translateHelper } from '../../../../helpers/translateHelper';

const targetLocales = locales.targetLocales; 
const fieldsToTranslate = ['about', 'fullName'];
const requiredFields = ['email', 'avatar', 'isTrustedBy'];



export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event);
  },
  async afterCreate(event) {
    const { result } = event
    const translationData = {
      about: result.about,
      fullName: result.fullName
    }
  
    await translateHelper(event, targetLocales, fieldsToTranslate, translationData, requiredFields);
  },
  async afterUpdate(event) {
    const { result } = event
    const translationData = {
      about: result.about,
      fullName: result.fullName
    }
    await translateHelper(event, targetLocales, fieldsToTranslate, translationData, requiredFields);
  }
};
