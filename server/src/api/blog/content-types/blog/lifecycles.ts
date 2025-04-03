import generateSlug from "../../../../helpers/generateSlug";
import locales from '../../../../../config/locales';
import { blogTranslater, prepareUpdateData } from '../../../../helpers/translateHelper';
import { extractJSON, translateText } from "../../../../services/translationService";

const targetLocales = locales.targetLocales;

const requiredFields = ['isArchive', 'isFeatured', 'tag', 'images', 'attachments'];

let isHookRunning = false;


export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event);
  },
  async afterCreate(event) {
    isHookRunning = true;

    // await blogTranslater(event, targetLocales, requiredFields);

    const { result } = event;
    
    if (result.locale !== 'hy') {
        return;
    }

    const translationData = {
        content: result.content,
        contribution: result.contribution
    };

    const translations = await translateText(translationData);
    const translatedObject = extractJSON(translations);

    for (const locale of targetLocales) {
        const translation = translatedObject[locale];

        if (locale === result.locale || !translation) {
            continue;
        }

        const service = strapi.documents(event.model.uid);
        const updateData = await prepareUpdateData(result, translation, locale, service, requiredFields);

        await service.update({
            documentId: result.documentId,
            locale,
            data: updateData
        });
    }
    isHookRunning = false;
  },
  async afterUpdate(event) {
    if (isHookRunning) {
      console.log("Skipping afterUpdate because afterCreate is running.");
      return;
    }
    isHookRunning = true;
    
    // await blogTranslater(event, targetLocales, requiredFields);
    const { result } = event;
    
    if (result.locale !== 'hy') {
        return;
    }

    const translationData = {
        content: result.content,
        contribution: result.contribution
    };

    const translations = await translateText(translationData);
    const translatedObject = extractJSON(translations);

    for (const locale of targetLocales) {
        const translation = translatedObject[locale];

        // console.log("_______translation_____",locale, translation);
        
        if (locale === result.locale || !translation) {
            continue;
        }

        const service = strapi.documents(event.model.uid);
        const updateData = await prepareUpdateData(result, translation, locale, service, requiredFields);

        await service.update({
            documentId: result.documentId,
            locale,
            data: updateData
        });
    }
    isHookRunning = false;
  }
};
