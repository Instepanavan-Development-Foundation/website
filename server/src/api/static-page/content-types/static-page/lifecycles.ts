import { translateText, extractJSON } from '../../../../services/translationService';
import locales from '../../../../../config/locales';

const targetLocales = locales.targetLocales; 

export default {
async afterCreate(event) {
    const { result } = event;

    if (result.locale !== 'hy') return;
    
    const data = {
      title: result.title,
      description: result.description
    };

    const translations = await translateText(data);

    const translatedObject = extractJSON(translations);

    for (const locale of targetLocales) {
      const translation = translatedObject[locale];

      if (!translation) return;

      await strapi.db.query('api::static-page.static-page').create({
        data: {
          title: translation.title,
          description: translation.description,
          locale,
        }
      });
    }
  },

//   async afterUpdate(event) {
//     const { result } = event;

//     if (result.locale !== 'hy') return;

//     console.log(result);

//     const data = {
//         title: result.title,
//         description: result.description
//       };

//     const translations = await translateText(data);

//     const translatedObject = extractJSON(translations);

//     for (const locale of targetLocales) {
//         const translation = translatedObject[locale];
  
//         if (!translation) return;
  
//         await strapi.db.query('api::static-page.static-page').update({
//           where: {
//             id: result.id,
//           },
//           data: {
//             title: translation.title,
//             description: translation.description,
//             locale,
//           }
//         });
//       }
//     console.log("Translations Updated Successfully");
//   },

};
