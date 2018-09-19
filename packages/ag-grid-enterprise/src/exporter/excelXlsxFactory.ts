import {Autowired, Bean, XmlFactory, XmlElement} from 'ag-grid-community';

import core from './files/ooxml/core';
import contentTypes from './files/ooxml/contentTypes';
import officeTheme from './files/ooxml/themes/office';
import workbook from './files/ooxml/workbook';
import worksheet from './files/ooxml/worksheet';
import relationships from './files/ooxml/relationships';

import {ExcelStyle, ExcelWorksheet} from 'ag-grid-community';

/**
 * See https://www.ecma-international.org/news/TC45_current_work/OpenXML%20White%20Paper.pdf
 */
@Bean('excelXlsxFactory')
export class ExcelXlsxFactory {

    @Autowired('xmlFactory') private xmlFactory: XmlFactory;

    private createXmlPart(body: XmlElement): string {
        const header = this.xmlFactory.createHeader({
            encoding: 'UTF-8',
            standalone: 'yes'
        });

        const xmlBody = this.xmlFactory.createXml(body);
        return `${header}${xmlBody}`;
    }

    public createExcel(styles: ExcelStyle[], worksheets: ExcelWorksheet[]): string {
        return this.worksheet(worksheets);
    }

    public core(): string {
        return this.createXmlPart(core.getTemplate());
    }

    public contentTypes(): string {
        return this.createXmlPart(contentTypes.getTemplate());
    }

    public rels(): string {
        const rs = relationships.getTemplate([{
            Id: 'rId1',
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument',
            Target: 'xl/workbook.xml'
        },{
            Id: 'rId2',
            Type: 'http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties',
            Target: 'docProps/core.xml'
        }]);

        return this.createXmlPart(rs);
    }

    public theme(): string {
        return this.createXmlPart(officeTheme.getTemplate());
    }

    public workbook(): string {
        return this.createXmlPart(workbook.getTemplate());
    }

    public workbookRels(): string {
        const rs = relationships.getTemplate([{
            Id: 'rId1',
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet',
            Target: 'worksheets/sheet1.xml'
        }, {
            Id: 'rId2',
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
            Target: 'theme/theme1.xml'
        }, {
            Id: 'rId3',
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
            Target: 'styles.xml'
        },{
            Id: 'rId4',
            Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings',
            Target: 'sharedStrings.xml'
        }]);

        return this.createXmlPart(rs);
    }

    public worksheet(worksheets: ExcelWorksheet[]): string {
        return this.createXmlPart(worksheet.getTemplate(worksheets[0]));
    }
}