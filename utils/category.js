const { object } = require('joi');
const { Category, DataField } = require('../app/models/category/Category')
module.exports = {
    getAllCategories: async () => {
        try {
            let categories = await Category.find().populate('subcategories');
            return categories;
        } catch (err) {
            return false;
        }
    },
    sortTableDataByTableHeader: (tableHeaders, tableData) => {



        let sortedB = tableData.map(item => {
            const newObj = Object.keys(item).reduce((acc, key) => {
                acc[key.toLowerCase()] = item[key];
                return acc;
            }, {});
            let sortedItem = {};
            tableHeaders.map(key => {
                // sortedItem[key.toLowerCase().replace(/\s+/g, '').replace(/_ /g, '')] = item[key.toLowerCase().replace(/\s+/g, '').replace(/_ /g, '')];
                sortedItem[key.toLowerCase().replace(/\s+/g, '_').replace(/_ /g, '').replace(/-/g, '')] = newObj[key.toLowerCase().replace(/\s+/g, '_').replace(/_ /g, '')];
            });
            return sortedItem;
        }).sort((tableHeaders, tableData) => {
            for (let i = 0; i < tableData.length; i++) {
                const key = tableData[i];
                if (tableData[key] < tableHeaders[key]) return -1;
                if (tableData[key] > tableHeaders[key]) return 1;
            }
            return 0;
        });

        return sortedB;
    },

    getdataFieldWithValidationRule: async (category) => {

        let finalResponse = [];

        if (category.have_data) {
            let dataFieldAndRule = await DataField.find({ category: category._id }).populate({
                path: 'validationRule',
                select: 'rule'
            })
                .select('name validationRule');
            for (let value of dataFieldAndRule) {
                finalResponse.push({ field: value.name, rule: value.validationRule.rule });
            }
        } else {

            let subcategories = category.subcategories;
            let updatedSubcategories = [];
            for (let subcategory of subcategories) {
                let dataFieldAndRule = await DataField.find({ subCategory: subcategory._id }).populate({
                    path: 'validationRule',
                    select: 'rule'
                })
                    .select('name validationRule');
                for (let value of dataFieldAndRule) {
                    updatedSubcategories.push({ field: value.name, rule: value.validationRule.rule });
                }
                // updatedSubcategories.push({ field: dataFieldAndRule.name, rule: dataFieldAndRule.validationRule.rule });
            }
            finalResponse.push(updatedSubcategories);

        }

        return finalResponse;
    },

    getImageDataFieldInCategory: async (category) => {


        let dataFieldAndRule = await DataField.find({ category: category._id }).populate({
            path: 'validationRule',
            select: 'rule'
        })
            .select('name validationRule');


        const valueWithImage = dataFieldAndRule.find(item => item.validationRule.rule === 'Image');


        return valueWithImage ? valueWithImage.name : '';
    },

    getImageDataFieldInSubCategory: async (subCategory) => {


        let dataFieldAndRule = await DataField.find({ subCategory: subCategory._id }).populate({
            path: 'validationRule',
            select: 'rule'
        })
            .select('name validationRule');


        const valueWithImage = dataFieldAndRule.find(item => item.validationRule.rule === 'Image');


        return valueWithImage ? valueWithImage.name : '';
    },

    getDatafieldAndRulesFromCategory: async (categories) => {
        let finalResponse = [];

        for (let category of categories) {
            if (category.have_data) {
                let dataFieldAndRule = await DataField.find({ category: category._id }).populate({
                    path: 'validationRule',
                    select: 'rule'
                })
                    .select('name validationRule');
                // category[dataFieldsAndType] = dataFieldAndRule;
                category = category.toObject();
                let customdataFieldAndRule = [];
                for (let data of dataFieldAndRule) {
                    customdataFieldAndRule.push({ name: data.name, rule: data.validationRule ? data.validationRule.rule : '' })
                }
                category.dataFieldsAndType = customdataFieldAndRule; // Add new field to category object

                finalResponse.push(category);
            } else {

                let subcategories = category.subcategories;
                let updatedSubcategories = [];
                for (let subcategory of subcategories) {
                    let dataFieldAndRule = await DataField.find({ subCategory: subcategory._id }).populate({
                        path: 'validationRule',
                        select: 'rule'
                    })
                        .select('name validationRule');
                    // category[dataFieldsAndType] = dataFieldAndRule;
                    subcategory = subcategory.toObject();

                    let customdataFieldAndRule = [];
                    for (let data of dataFieldAndRule) {
                        // console.log(data.validationRule.rule)
                        // console.log('===================')
                        customdataFieldAndRule.push({ name: data.name, rule: data.validationRule.rule })
                    }

                    subcategory.dataFieldsAndType = customdataFieldAndRule; // Add new field to subcategory object
                    updatedSubcategories.push(subcategory);
                }
                let updatedCategory = category.toObject();
                updatedCategory.subcategories = updatedSubcategories;
                finalResponse.push(updatedCategory);

            }
        }
        return finalResponse;
    },

    getFinalDataBasedOnType: async (category) => {
        let finalData = [];
        let allData = category?.data;
        let dataFieldsAndType = category?.dataFieldsAndType;
        const groupedData = dataFieldsAndType?.reduce((result, item) => {
            const { rule, ...rest } = item
            let updateRuleName = rule?.toLocaleLowerCase().replace(/\s+/g, '_');
            if (!result[updateRuleName]) {
                result[updateRuleName] = [];
            }
            result[updateRuleName].push(rest);
            return result;
        }, {})

        for (const rule in groupedData) {
            if (groupedData.hasOwnProperty(rule)) {
                const items = groupedData[rule];
                finalData[rule] = [];
                for (const item of items) {
                    finalData[rule].push(item.name)
                }
            }
        }

        finalData = allData?.map((item) => {
            let newItem = {};
            for (const rule in groupedData) {

                if (groupedData.hasOwnProperty(rule)) {
                    const fieldNames = groupedData[rule];

                    for (const fieldName of fieldNames) {
                        let detailToInsert = item[fieldName.name];
                        if (!newItem[rule]) {
                            newItem[rule] = []
                        }
                        if (rule === 'image' && typeof item[fieldName.name] == 'object') {
                            for (let item2 of detailToInsert) {
                                newItem[rule].push(item2)
                            }
                        } else {
                            (item[fieldName.name] != undefined) ? newItem[rule].push(item[fieldName.name]) : ''
                        }


                    }
                }
            }

            return newItem;
        });

        return finalData;
    }


};
