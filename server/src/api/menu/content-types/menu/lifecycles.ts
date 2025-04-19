import locales from '../../../../../config/locales';
import { menuTranslater } from '../../../../helpers/translateHelper';

const targetLocales = locales.targetLocales; 

export default {
  async afterCreate(event) {
    const { result } = event
    const translationData = {
        title: result.title,
        links: result.links
    };

    await menuTranslater(event, targetLocales, translationData)
  },
  
  async afterUpdate(event) {
    const { result } = event
    const translationData = {
        title: result.title,
        links: result.links
    };

    await menuTranslater(event, targetLocales, translationData)
  }
};
