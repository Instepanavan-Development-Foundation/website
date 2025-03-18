import generateSlug from "../../../../helpers/generateSlug";
import locales from '../../../../../config/locales';
import { blogTranslater } from '../../../../helpers/translateHelper';
import { translateText, extractJSON } from "../../../../services/translationService";

const targetLocales = locales.targetLocales;

const requiredFields = ['isArchive', 'isFeatured','tag'];

export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event);
  },
  async afterCreate(event) {
      await blogTranslater(event, targetLocales);
  },
  // async afterUpdate(event) {
  //     await blogTranslater(event, targetLocales);        
  // }
};
