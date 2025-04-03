import locales from '../../../../../config/locales';
import { extractJSON, translateText } from '../../../../services/translationService';

const targetLocales = locales.targetLocales; 

export default {
  async afterCreate(event) {
    const { result } = event;

    if (result.locale !== 'hy') {
        return;
    }

    const translationData = {
        title: result.title,
        links: result.links
    };

    const translations = await translateText(translationData);
    const translatedObject = extractJSON(translations);

    for (const locale of targetLocales) {
        const translation = translatedObject[locale];

        if (locale === result.locale || !translation) {
            continue;
        }

        const service = strapi.documents(event.model.uid);
        
        const updateData = {
            title: translation.title,
            links: []
        }

        for (const link of result.links) {
            updateData.links.push({
                title: translation.title,
                ...link
        })
        }
        
        await service.update({
            documentId: result.documentId,
            locale,
            data: updateData
        });
    }
  },
  async afterUpdate(event) {
    const { result } = event;

    

    if (result.locale !== 'hy') {
        return;
    }

    const translationData = {
        title: result.title,
        links: result.links
    };

    const translations = await translateText(translationData);
    const translatedObject = extractJSON(translations);

    for (const locale of targetLocales) {
        const translation = translatedObject[locale];

        if (locale === result.locale || !translation) {
            continue;
        }

        const service = strapi.documents(event.model.uid);
        
        const links = result.links?.map((link, index) => {
            const translatedTitle = translation.links?.[index]?.title || link.title;
            const { id, ...rest } = link;
            return { ...rest, title: translatedTitle };
        });
        
        const updateData = {
            title: translation.title,
            links
        }

        await service.update({
            documentId: result.documentId,
            locale,
            data: updateData
        });
    }   
  }
};
