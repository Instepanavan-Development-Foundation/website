import locales from '../../../../../config/locales';
import { translateHelper } from '../../../../helpers/translateHelper';

const targetLocales = locales.targetLocales; 
const fieldsToTranslate = ['title', 'description'];

export default {
    async afterCreate(event) {
        await translateHelper(event, targetLocales, fieldsToTranslate);
    },
    async afterUpdate(event) {
        await translateHelper(event, targetLocales, fieldsToTranslate);        
    }
};
