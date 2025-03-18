import { translateText, extractJSON } from "../services/translationService";


export async function translateHelper(
    event: any, 
    targetLocales: string[],
    fieldsToTranslate: string[],
    requiredFields: string[] = []
) {

    const { result } = event;
   
    if (result.locale !== 'hy') {
        return
    };

    const translationData = {};
    
    for (const field of fieldsToTranslate) {
        if (result[field] && typeof result[field] === 'string') {
            translationData[field] = result[field];
        }
    }

    const translations = await translateText(translationData);

    const translatedObject = extractJSON(translations);

    
    for (const locale of targetLocales) {
        const translation = translatedObject[locale];
        
        if (locale === result.locale) {
            continue;
        }

        if (!translation) {
            return
        };

        const service = strapi.documents(event.model.uid);

        const updateData = {};
        
        for (const field of fieldsToTranslate) {
            if (translation[field]) {
                updateData[field] = translation[field];
            }
        }

        for (const field of requiredFields) {
            if (result[field] !== undefined) {
                updateData[field] = result[field];
            }
        }

        await service.update({
            documentId: result.documentId,
            locale,
            data: updateData
        });
    }
};


export async function blogTranslater(
    event: any, 
    targetLocales: string[],
    requiredFields: string[] = []
) {
    const { result } = event;
                  
    if (result.locale !== 'hy') {
        return
    };

    const translationData = {
      content: result.content,
      contribution: result.contribution
    };

    const translations = await translateText(translationData);

    const translatedObject = extractJSON(translations);
    
    for (const locale of targetLocales) {
        const translation = translatedObject[locale];
        
        if (locale === result.locale) {
            continue;
        }

        if (!translation) {
            return
        };

        const service = strapi.documents(event.model.uid);

        const updateData = {
          content: translation.content,
          contribution: translation.contribution
        };

        const populated = await service.findOne({
          documentId: result.documentId,
          populate:['project'],
         });

        const docId = populated.project.documentId;
         
        const project = await strapi.documents("api::project.project").findOne({
          documentId: docId,
          locale
        })

        updateData['project'] = project;

        for (const field of requiredFields) {
            if (result[field] !== undefined) {
                updateData[field] = result[field];
            }
        }
      
        await service.update({
            documentId: result.documentId,
            locale,
            data: updateData
        });
    }
}