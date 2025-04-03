import generateSlug from "../../../../helpers/generateSlug";
import locales from '../../../../../config/locales';
import { addFields, addRequiredFields, translateHelper } from '../../../../helpers/translateHelper';
import { extractJSON, translateText } from "../../../../services/translationService";

const targetLocales = locales.targetLocales;
const fieldsToTranslate = ['name', 'description', 'about', 'events'];
const requiredFields = ['donationType', 'image', 'isFeatured', 'isArchived', 'fundraisingURL', 'requiredAmount', 'gatheredAmount', 'slider', 'isMain']

export default {
  beforeCreate(event) {
    event.params.data.slug = generateSlug(event);
  },
  async afterCreate(event) {
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

        await service.update({
            documentId: result.documentId,
            locale,
            data: updateData
        });
    }
  }
};