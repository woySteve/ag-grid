import {ExcelOOXMLTemplate, ExcelCell, _} from 'ag-grid-community';

const cell: ExcelOOXMLTemplate = {
    getTemplate(config: ExcelCell) {
        const {ref, data, styleId} = config;
        const {type, value} = data;
        const obj = {
            name: 'c',
            properties: {
                rawMap: {
                    r: ref,
                    t: type,
                    //s: styleId
                }
            }
        };

        let children;

        if (type === 'inlineStr') {
            children = [{
                name: 'is',
                children: [{
                    name: 't',
                    textNode: value
                }]
            }];
        } else {
            children = [{
                name: 'v',
                textNode: value
            }];
        }

        return _.assign({}, obj, { children });
    }
};

export default cell;