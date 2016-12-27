import ElementColumn from './schema/element-column';
import SimpleColumn from './schema/simple-column';

export default class FormFieldSchema {
  constructor({fullSchema = false}) {
    this.fullSchema = fullSchema;
  }

  addSystemColumn(label, attribute, columnName) {
    const column = new SimpleColumn(label, attribute, columnName);
    this._columns.push(column);
    this._columnsByKey[columnName] = column;
  }

  addElementColumn(element, part) {
    const columnKey = part ? element.key + '_' + part : element.key;

    const column = this._rawColumnsByKey[columnKey];

    // if (column == null) {
    //   if the column is null, that means it's a materialized column
    //   throw new Error('Column not found for element ' + columnKey + Object.keys(this._rawColumnsByKey));
    // }

    const columnObject = new ElementColumn(element, column, null, part);

    this._columns.push(columnObject);
    this._columnsByKey[columnKey] = columnObject;
  }

  setupElementColumns() {
    for (const element of this.elementsForColumns) {
      if (element.isHidden || element.hasHiddenParent) {
        continue;
      }

      this.addElementColumn(element);

      if (this.fullSchema && element.isAddressElement) {
        this.addElementColumn(element, 'sub_thoroughfare');
        this.addElementColumn(element, 'thoroughfare');
        this.addElementColumn(element, 'suite');
        this.addElementColumn(element, 'locality');
        this.addElementColumn(element, 'sub_admin_area');
        this.addElementColumn(element, 'admin_area');
        this.addElementColumn(element, 'postal_code');
        this.addElementColumn(element, 'country');
      }

      if (this.fullSchema && (element.isPhotoElement || element.isVideoElement || element.isAudioElement)) {
        this.addElementColumn(element, 'captions');
        this.addElementColumn(element, 'urls');
      }

      if (this.fullSchema && element.isSignatureElement) {
        this.addElementColumn(element, 'timestamp');
      }
    }
  }

  findColumnByID(id) {
    return this.columns.find(e => e.id === id);
  }

  columnForFieldKey(fieldKey, part) {
    if (part) {
      return this._columnsByKey[fieldKey + '_' + part];
    }

    return this._columnsByKey[fieldKey];
  }

  get columns() {
    return this._columns;
  }

  get allElements() {
    if (!this._allElements) {
      this._allElements = this.container.flattenElements(false);
    }
    return this._allElements;
  }

  get elementsForColumns() {
    if (!this._elementsForColumns) {
      this._elementsForColumns = [];

      const elements = this.allElements;

      for (const element of elements) {
        const skip = element.isSectionElement ||
                     element.isRepeatableElement ||
                     element.isLabelElement ||
                     element.isHidden;

        if (!skip) {
          this._elementsForColumns.push(element);
        }
      }
    }

    return this._elementsForColumns;
  }
}
