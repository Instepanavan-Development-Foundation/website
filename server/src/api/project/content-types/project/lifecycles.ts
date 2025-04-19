import generateSlug from "../../../../helpers/generateSlug";
import locales from '../../../../../config/locales';
import { projectTranslater } from '../../../../helpers/translateHelper';

const targetLocales = locales.targetLocales;
const fieldsToTranslate = ['name', 'description', 'about', 'events'];
const requiredFields = ['donationType', 'image', 'isFeatured', 'isArchived', 'fundraisingURL', 'requiredAmount', 'gatheredAmount', 'slider', 'isMain']

export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event);
  },
  async afterCreate(event) {
    await projectTranslater(event, targetLocales, fieldsToTranslate, requiredFields)
  },
  async afterUpdate(event) {
    await projectTranslater(event, targetLocales, fieldsToTranslate, requiredFields)
  }
};