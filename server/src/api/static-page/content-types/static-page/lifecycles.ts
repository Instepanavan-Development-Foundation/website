import locales from '../../../../../config/locales';
import { translateHelper } from '../../../../helpers/translateHelper';

const targetLocales = locales.targetLocales; 
const fieldsToTranslate = ['title', 'description'];
const requiredFields = ["attachments"]

export default {
    async afterCreate(event) {
        const { result } = event
        const translationData = {
            title: result.title,
            description: result.description
        }

        await translateHelper(event, targetLocales, fieldsToTranslate, translationData, requiredFields);
    },

    async afterUpdate(event) {
        const { result } = event
        const translationData = {
            title: result.title,
            description: result.description
        }
        await translateHelper(event, targetLocales, fieldsToTranslate, translationData, requiredFields);        
    }
};
