import {ExcelOOXMLTemplate, ExcelWorksheet, _} from 'ag-grid-community';
import column from './column';
import row from './row';

const worksheet: ExcelOOXMLTemplate = {
    getTemplate(config: ExcelWorksheet) {
        const {table} = config;
        const {rows, columns} = table;

        const children = [].concat(
            columns.length ? {
                name: 'cols',
                children: _.map(columns, column.getTemplate)
            } : []
        ).concat(
            rows.length ? {
                name: 'sheetData',
                children: _.map(rows, row.getTemplate)
            } : []
        );

        return {
            name: "worksheet",
            properties: {
                prefixedAttributes:[{
                    prefix: "xmlns:",
                    map: {
                        r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                    }
                }],
                rawMap: {
                    xmlns: "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
                }
            },
            children
        };
    }
};

export default worksheet;