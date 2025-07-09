import { translateText, extractJSON } from "../services/translationService";


export async function translateHelper(
    event: any, 
    targetLocales: string[],
    fieldsToTranslate: string[],
    translationData: any,
    requiredFields: string[] = []
) {

    const { result } = event;
   
    if (result.locale !== 'hy') {
        return
    };

    const translations = await translateText(translationData);
    const translatedObject = extractJSON(translations);

    
    for (const locale of targetLocales) {
        const translation = translatedObject[locale];
        
        if (locale === result.locale || !translation) {
            continue;
        }

        const service = strapi.documents(event.model.uid);

        const updateData = {};
        
        addFields(updateData, translation, fieldsToTranslate)

        addRequiredFields(updateData, result, requiredFields);
        
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
            data: updateData,
        });
    }
}


export async function prepareUpdateData(result: any, translation: any, locale: string, service: any, requiredFields: string[]) {
    const updateData = {
        content: translation.content,
        contribution: [],
        project: null
    };

    const populated = await fetchPopulatedData(service, result.documentId);
    updateData.project = await fetchProject(populated.project?.documentId, locale);

    if (populated.contribution) {
        updateData.contribution = await prepareContributions(populated.contribution, translation.contribution, locale);
    }

    addRequiredFields(updateData, result, requiredFields);

    return updateData;
}

async function fetchPopulatedData(service: any, documentId: string) {
    return await service.findOne({
        documentId,
        populate: ['project', 'contribution.contributor'],
    });
}

async function fetchProject(projectDocumentId: string, locale: string) {
    return await strapi.documents("api::project.project").findOne({
        documentId: projectDocumentId,
        locale
    });
}

async function prepareContributions(contributions: any[], translatedContributions: any[], locale: string) {
    const updatedContributions = [];

    for (const item of contributions) {
        const contributor = await fetchContributor(item.contributor?.documentId, locale);
        const translatedContribution = translatedContributions?.find((tc: any) => tc.id === item.id);
        
        if (!translatedContribution) {

            continue
        }
        
        const {id, ...rest} = translatedContribution

        updatedContributions.push({
            documentId: item.documentId,
            ...rest,
            contributor
        });
    }

    return updatedContributions;
}

async function fetchContributor(contributorDocumentId: string, locale: string) {
    return await strapi.documents("api::contributor.contributor").findOne({
        documentId: contributorDocumentId,
        locale
    });
}

export function addRequiredFields(updateData: any, result: any, requiredFields: string[]) {
    for (const field of requiredFields) {
        if (result[field] !== undefined) {
            updateData[field] = result[field];
        }
    }
}

export function addFields(updateData: any, translation: any, fieldsToTranslate: string[]) {
    for (const field of fieldsToTranslate) {
        updateData[field] = translation[field];
    }
}


export async function menuTranslater(
    event: any, 
    targetLocales: string[],
    translationData: any
){
    const { result } = event;

    if (result.locale !== 'hy') {
        return;
    }

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

export async function projectTranslater(
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
        translationData[field] = result[field];
    }

    const translations = await translateText(translationData);
    const translatedObject = extractJSON(translations);


    for (const locale of targetLocales) {
        const translation = translatedObject[locale];
        
        if (locale === result.locale || !translation) {
            continue;
        }

        const service = strapi.documents(event.model.uid);

        const updateData = {blogs: []};
        
        const populated = await service.findOne({
            documentId: result.documentId,
            populate: ['blogs'],
        });

        for(const blog of populated.blogs){
            const fetchedBlog = await strapi.documents("api::blog.blog").findOne({
            documentId: blog?.documentId,
            locale
            });

            updateData.blogs.push(fetchedBlog)
        }        

        addFields(updateData, translation, fieldsToTranslate)

        addRequiredFields(updateData, result, requiredFields);

        const {id, ...rest} = updateData["slider"]

        updateData["slider"] = rest
        
        await service.update({
            documentId: result.documentId,
            locale,
            data: updateData
        });
    }
}