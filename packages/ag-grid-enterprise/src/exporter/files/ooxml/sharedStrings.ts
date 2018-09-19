import {ExcelOOXMLTemplate, XmlElement} from 'ag-grid-community';

const buildSharedString = (textNode: string): XmlElement => ({
    name: 'si',
    children: [{
        name: 't',
        textNode
    }]
});

const sharedStrings: ExcelOOXMLTemplate = {
    getTemplate(strings: string[]) {
        return {
            name: "sheets",
            children: strings.map(buildSharedString)
        };
    }
};

export default sharedStrings;