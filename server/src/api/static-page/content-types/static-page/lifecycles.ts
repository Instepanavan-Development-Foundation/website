import { translateText, extractJSON } from '../../../../services/translationService';
import locales from '../../../../../config/locales';

const targetLocales = locales.targetLocales; 

export default {
//   async afterCreate(event) {
//     const { result } = event;
//     // If the locale is not Armenian (hy), exit early
//     if (result.locale !== 'hy') return;

//     const targetLocales = ['en', 'fr', 'ru'];
//     const targetLanguages = ['English', 'French', 'Russian'];

//     // Translate the content into English, French, and Russian
//     const translations = await Promise.all(
//         targetLanguages.map(lang => translateText(result.title, lang))
//     )

//     for (let i = 0; i < targetLocales.length; i++) {
//         const locale = targetLocales[i];
//         const translatedText = translations[i];

//         if (!translatedText) continue;

//         console.log(`Creating translation for ${locale} locale with text: ${translatedText}`);
        

//     }

    
//     // Create translated entries with correct locales
//     // await Promise.all([
//     //   strapi.entityService.create('api::static-page.static-page', {
//     //     data: {
//     //       title: result.title,  // Keeping the same title
//     //       description: result.description, // Keeping same description
//     //       content: translations[0],
//     //       locale: 'en',
//     //       localizations: [result.id], // Link translation
//     //       publishedAt: new Date(), // Ensure it's published
//     //     },
//     //   }),
//     //   strapi.entityService.create('api::static-page.static-page', {
//     //     data: {
//     //       title: result.title,
//     //       description: result.description,
//     //       content: translations[1],
//     //       locale: 'fr',
//     //       localizations: [result.id],
//     //       publishedAt: new Date(),
//     //     },
//     //   }),
//     //   strapi.entityService.create('api::static-page.static-page', {
//     //     data: {
//     //       title: result.title,
//     //       description: result.description,
//     //       content: translations[2],
//     //       locale: 'ru',
//     //       localizations: [result.id],
//     //       publishedAt: new Date(),
//     //     },
//     //   }),
//     // ]);
//     // translations.forEach(t => {
//     //     if ('text' in t) {
//     //         console.log("Translations Created Successfully", t.text);
//     //       }
//     // });
    
//   },

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
