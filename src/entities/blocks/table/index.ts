import type {
  BlockElement,
  BlockSchema,
  BlockSchemaData,
  BlockCreateSchema,
  TableRowSchema,
  TableColumnAlign,
  BlockModelConstructor,
  TableBlockModelConfig,
  TableBlockModel,
  PasteMap,
} from '@/types';

import BlockModel from '@/core/models/block-model';
import {
  IconTable,
  IconTableToggleHeader,
  IconTableAddRowAbove,
  IconTableAddRowBelow,
  IconTableAlign,
  IconTableAlignLeft,
  IconTableAlignCenter,
  IconTableAlignRight,
  IconTableAddColumnLeft,
  IconTableAddColumnRight,
  IconTableRow,
  IconTableColumn,
  IconArrowLeft,
  IconArrowRight,
  IconTrash,
} from '@/icons';

import { renderIcon } from '@/utils/icon';

import {
  addClass,
  append,
  attr,
  html,
  make,
  queryList,
  off,
  removeClass,
  isEmptyString,
  data,
  rebind,
  query,
  css,
  text,
} from 'snappykit';

import '@/styles/entities/blocks/table.css';

export default class Table extends BlockModel implements TableBlockModel {
  private tableElement: HTMLTableElement | null = null;
  private activeCell: HTMLTableCellElement | null = null;
  private activeRow: HTMLTableRowElement | null = null;
  private controlsElement: HTMLElement | null = null;
  private controlsPanel: HTMLElement | null = null;
  private controlsSubpanel: HTMLElement | null = null;
  private toggleHeaderItem: HTMLElement | null = null;
  private alignItems: Record<TableColumnAlign, HTMLElement> | null = null;
  private applyToAll: boolean = false;

  /** @see TableBlockModel.setup */
  public static setup(config: Partial<TableBlockModelConfig>): BlockModelConstructor {
    return super.setup(config);
  }

  /**
   * Configure block model
   * @returns Partial configuration object
   */
  protected configure(): Partial<TableBlockModelConfig> {
    return {
      name: 'table',
      translation: 'table',
      groupCode: 'table',
      tagName: 'div',
      icon: IconTable,
      className: 'tex-table',
      contentClassName: 'tex-table-content',
      editable: false,
      editableItems: true,
      customSave: true,
      autoParse: false,
      autoMerge: false,
      convertible: false,
      enterCreate: false,
      backspaceRemove: false,
      visibleTools: true,
      sanitizer: true,
      sanitizerConfig: {
        elements: ['b', 'a', 'i', 's', 'u', 'sup', 'sub', 'mark', 'code', 'br'],
        attributes: {
          a: ['href', 'target'],
        },
        protocols: {
          a: {
            href: ['https', 'ftp', 'http', 'mailto'],
          },
        },
      },

      defaultRows: 3,
      defaultCols: 3,
      maxRows: 100,
      maxCols: 10,
      withHeader: true,
    };
  }

  /** @see TableBlockModel.getDefaultRows */
  getDefaultRows(): number {
    return this.getConfig('defaultRows', 3);
  }

  /** @see TableBlockModel.getDefaultCols */
  getDefaultCols(): number {
    return this.getConfig('defaultCols', 3);
  }

  /** @see TableBlockModel.getMaxRows */
  getMaxRows(): number {
    return this.getConfig('maxRows', 100);
  }

  /** @see TableBlockModel.getMaxCols */
  getMaxCols(): number {
    return this.getConfig('maxCols', 10);
  }

  /** @see TableBlockModel.getWithHeader */
  getWithHeader(): boolean {
    return this.getConfig('withHeader', true);
  }

  /**
   * Composes the block DOM: builds the table and initializes controls.
   *
   * @param createSchema - Optional schema for the initial composition.
   * @returns The composed block element.
   */
  protected compose(createSchema?: BlockCreateSchema): BlockElement {
    const cssTC = 'tex-table';

    const blockElement = this.getElement();
    const contentElement = this.getContentElement();
    if (!contentElement) return blockElement;

    html(contentElement, '');

    const table = make('table', (el: HTMLTableElement) => {
      addClass(el, cssTC + '-grid');
      attr(el, 'cellspacing', '0');
      attr(el, 'cellpadding', '0');
    });

    const tbody = make('tbody');
    append(table, tbody);

    const schemaData = createSchema?.data as TableRowSchema[] | undefined;

    if (Array.isArray(schemaData) && schemaData.length) {
      this.fillFromSchema(tbody, schemaData);
    } else {
      this.fillDefault(tbody);
    }

    this.tableElement = table;
    append(contentElement, table);

    this.createControls(contentElement);
    this.bindCellEvents();
    this.bindTableEvents();

    return blockElement;
  }

  /**
   * Fills the table body from a provided row schema.
   *
   * @param tbody - Table body element.
   * @param schema - Rows schema.
   * @returns void
   */
  private fillFromSchema(tbody: HTMLElement, schema: TableRowSchema[]): void {
    const cssTR = 'tex-table-row';

    schema.forEach((rowSchema) => {
      const tr = make('tr', (el: HTMLTableRowElement) => addClass(el, cssTR));

      const rowType: 'th' | 'td' = rowSchema.cells[0]?.type === 'th' ? 'th' : 'td';

      rowSchema.cells.forEach((cellData) => {
        const cell = this.createCell(rowType);

        if (!isEmptyString(cellData.content)) html(cell, cellData.content);

        if (cellData.align) {
          data(cell, 'align', cellData.align);
          css(cell, 'textAlign', cellData.align);
        }
        append(tr, cell);
      });

      append(tbody, tr);
    });
  }

  /**
   * Fills the table body with default empty rows and columns.
   *
   * @param tbody - Table body element.
   * @returns void
   */
  private fillDefault(tbody: HTMLElement): void {
    const cssTR = 'tex-table-row';

    const defaultRows = this.getConfig('defaultRows', 3) as number;
    const defaultCols = this.getConfig('defaultCols', 3) as number;
    const withHeader = this.getConfig('withHeader', true) as boolean;

    for (let row = 0; row < defaultRows; row++) {
      const tr = make('tr', (el: HTMLTableRowElement) => addClass(el, cssTR));

      const cellType: 'th' | 'td' = row === 0 && withHeader ? 'th' : 'td';

      for (let col = 0; col < defaultCols; col++) {
        append(tr, this.createCell(cellType));
      }

      append(tbody, tr);
    }
  }

  /**
   * Creates a table cell with the given type.
   *
   * @param cellType - Cell type ('th' | 'td').
   * @param content - Optional initial HTML content.
   * @returns The created cell element.
   */
  private createCell(cellType: 'th' | 'td', content: string = ''): HTMLTableCellElement {
    const cssTC = 'tex-table-cell';
    const cell = make(cellType) as HTMLTableCellElement;

    addClass(cell, cssTC);
    addClass(cell, cssTC + '-' + cellType);
    attr(cell, 'contentEditable', 'true');
    data(cell, 'cellType', cellType);

    if (!isEmptyString(content)) html(cell, content);

    return cell;
  }

  /**
   * Creates the controls menu wrapper and the initial panel with triggers.
   *
   * @param contentElement - Block content element to append the menu into.
   * @returns void
   */
  private createControls(contentElement: HTMLElement): void {
    const cssTC = 'tex-table-control';
    const cssTCs = cssTC + 's';

    const wrap = make('div', (el: HTMLElement) => addClass(el, cssTCs + ' tex-animate-fadeIn'));

    const panel = make('div', (el: HTMLElement) => addClass(el, cssTCs + '-panel'));

    this.controlsPanel = panel;

    const rowTrigger = this.makeTrigger('row', 'Row', IconTableRow),
      colTrigger = this.makeTrigger('column', 'Column', IconTableColumn);

    append(panel, [rowTrigger, colTrigger]);

    const subpanel = make('div', (el: HTMLElement) => addClass(el, cssTCs + '-subpanel'));

    this.controlsSubpanel = subpanel;

    append(wrap, [panel, subpanel]);
    this.controlsElement = wrap;
    append(contentElement, wrap);
  }

  /**
   * Renders the subpanel content for the given trigger ('row' | 'column').
   *
   * @param name - Subpanel type.
   * @returns void
   */
  private renderSubpanelContent(name: 'row' | 'column'): void {
    const cssTC = 'tex-table-control';
    const cssTCs = cssTC + 's';
    const cssTC_SP = cssTCs + '-subpanel';
    const cssTC_SPB = cssTC_SP + '-back',
      cssTC_SPT = cssTC_SP + '-title',
      cssTC_SPI = cssTC_SP + '-back-icon',
      eid = this.getEventId(),
      panel = this.controlsPanel,
      subpanel = this.controlsSubpanel;

    if (!panel || !subpanel) return;

    html(subpanel, '');

    const backBtn = make('div', (el: HTMLElement) => addClass(el, cssTC_SPB)),
      backIcon = make('span', (el: HTMLSpanElement) => {
        addClass(el, cssTC_SPI);
        html(
          el,
          renderIcon(IconArrowLeft, {
            width: 12,
            height: 12,
          }),
        );
      }),
      backLabel = make('span', (el: HTMLSpanElement) => {
        addClass(el, cssTC_SPT);
        text(el, this.editor.i18n.get(name, name));
      });

    append(backBtn, [backIcon, backLabel]);

    rebind(backBtn, 'click.back' + eid, (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.closeSubpanel();
    });

    append(subpanel, backBtn);

    if (name === 'row') {
      this.toggleHeaderItem = this.appendPanelItem(
        subpanel,
        'rowToggleHeader',
        'Toggle header',
        IconTableToggleHeader,
        () => this.toggleRowHeader(),
      );

      this.appendPanelItem(subpanel, 'rowAddAbove', 'Add above', IconTableAddRowAbove, () => this.addRow('above'));

      this.appendPanelItem(subpanel, 'rowAddBelow', 'Add below', IconTableAddRowBelow, () => this.addRow('below'));

      this.appendPanelItem(subpanel, 'rowRemove', 'Remove row', IconTrash, () => this.removeRow(), true);
    } else {
      const alignItem = this.appendPanelItem(subpanel, 'columnAlign', 'Align', IconTableAlign, () =>
        this.openAlignSubpanel(),
      );
      this.appendSubmenuArrow(alignItem);

      this.appendPanelItem(subpanel, 'columnAddLeft', 'Add left', IconTableAddColumnLeft, () => this.addColumn('left'));

      this.appendPanelItem(subpanel, 'columnAddRight', 'Add right', IconTableAddColumnRight, () =>
        this.addColumn('right'),
      );

      this.appendPanelItem(subpanel, 'columnRemove', 'Remove column', IconTrash, () => this.removeColumn(), true);
    }

    addClass(panel, cssTCs + '-panel-hidden');
    addClass(subpanel, cssTCs + '-subpanel-visible');

    this.refreshControlsPosition();
  }

  /**
   * Renders the "Align" submenu inside the subpanel.
   *
   * @returns void
   */
  private openAlignSubpanel(): void {
    const cssTC = 'tex-table-control';
    const cssTCs = cssTC + 's';
    const cssTC_SP = cssTCs + '-subpanel';
    const cssTC_SPB = cssTC_SP + '-back';
    const cssTC_SPT = cssTC_SP + '-title';
    const cssTC_SPI = cssTC_SP + '-back-icon';
    const cssTC_SPC = cssTC_SP + '-checkbox';

    const subpanel = this.controlsSubpanel;
    if (!subpanel) return;

    const eid = this.getEventId();

    html(subpanel, '');

    const backBtn = make('div', (el: HTMLElement) => addClass(el, cssTC_SPB)),
      backIcon = make('span', (el: HTMLSpanElement) => {
        addClass(el, cssTC_SPI);
        html(
          el,
          renderIcon(IconArrowLeft, {
            width: 12,
            height: 12,
          }),
        );
      }),
      backLabel = make('span', (el: HTMLSpanElement) => {
        addClass(el, cssTC_SPT);
        text(el, this.editor.i18n.get('columnAlign', 'Align'));
      });

    append(backBtn, [backIcon, backLabel]);

    rebind(backBtn, 'click.back' + eid, (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.renderSubpanelContent('column');
    });

    append(subpanel, backBtn);

    const alignLeftItem = this.appendPanelItem(subpanel, 'columnAlignLeft', 'Left', IconTableAlignLeft, () =>
        this.applyAlign('left'),
      ),
      alignCenterItem = this.appendPanelItem(subpanel, 'columnAlignCenter', 'Center', IconTableAlignCenter, () =>
        this.applyAlign('center'),
      ),
      alignRightItem = this.appendPanelItem(subpanel, 'columnAlignRight', 'Right', IconTableAlignRight, () =>
        this.applyAlign('right'),
      );

    this.alignItems = {
      left: alignLeftItem,
      center: alignCenterItem,
      right: alignRightItem,
    };

    const separator = make('div', (el: HTMLElement) => addClass(el, cssTC_SP + '-separator'));

    append(subpanel, separator);

    const checkbox = make('div', (el: HTMLElement) => {
        addClass(el, cssTC_SPC);
        if (this.applyToAll) addClass(el, cssTC_SPC + '-checked');
      }),
      checkboxBox = make('span', (el: HTMLSpanElement) => addClass(el, cssTC_SPC + '-box')),
      checkboxLabel = make('span', (el: HTMLSpanElement) => {
        addClass(el, cssTC_SPC + '-label');
        text(el, this.editor.i18n.get('columnAlignApplyToAll', 'Apply to all cells'));
      });

    append(checkbox, [checkboxBox, checkboxLabel]);

    rebind(checkbox, 'click.tableCheckbox' + eid, (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();

      this.applyToAll = !this.applyToAll;

      if (this.applyToAll) addClass(checkbox, cssTC_SPC + '-checked');
      else removeClass(checkbox, cssTC_SPC + '-checked');
    });

    append(subpanel, checkbox);

    this.syncControlsState();
    this.refreshControlsPosition();
    setTimeout(() => this.refreshControlsPosition(), 10);
  }

  /**
   * Closes the subpanel and returns to the main panel.
   *
   * @returns void
   */
  private closeSubpanel(): void {
    const cssTCs = 'tex-table-controls';

    const panel = this.controlsPanel;
    const subpanel = this.controlsSubpanel;

    if (!panel || !subpanel) return;

    html(subpanel, '');
    removeClass(subpanel, cssTCs + '-subpanel-visible');
    removeClass(panel, cssTCs + '-panel-hidden');

    this.refreshControlsPosition();
  }

  /**
   * Adds a trailing arrow indicator to a menu item that opens a nested submenu.
   *
   * @param item - Menu item element.
   * @returns void
   */
  private appendSubmenuArrow(item: HTMLElement): void {
    const cssTCS = 'tex-table-control-submenu';
    const arrow = make('span', (el: HTMLSpanElement) => {
      addClass(el, cssTCS + '-item-submenu-arrow');
      html(
        el,
        renderIcon(IconArrowRight, {
          width: 10,
          height: 10,
        }),
      );
    });
    append(item, arrow);
  }

  /**
   * Creates a top-level trigger item (Row / Column).
   *
   * @param name - Trigger name.
   * @param label - Default label.
   * @param icon - Icon SVG string.
   * @returns The created trigger element.
   */
  private makeTrigger(name: string, label: string, icon: string): HTMLElement {
    const cssTC = 'tex-table-control';
    const cssTCT = cssTC + '-trigger';
    const eid = this.getEventId();

    const item = make('div', (el: HTMLElement) => {
      addClass(el, cssTCT);
      data(el, 'name', name);
    });

    const iconEl = make('span', (el: HTMLSpanElement) => {
      addClass(el, cssTCT + '-icon');
      html(
        el,
        renderIcon(icon, {
          width: 14,
          height: 14,
        }),
      );
    });

    const labelEl = make('span', (el: HTMLSpanElement) => {
      addClass(el, cssTCT + '-label');
      text(el, this.editor.i18n.get(name, label));
    });

    const arrow = make('span', (el: HTMLSpanElement) => {
      addClass(el, cssTCT + '-arrow');
      html(
        el,
        renderIcon(IconArrowRight, {
          width: 10,
          height: 10,
        }),
      );
    });

    append(item, [iconEl, labelEl, arrow]);

    rebind(item, 'click.trigger' + eid, (evt: Event) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.renderSubpanelContent(name as 'row' | 'column');
    });

    return item;
  }

  /**
   * Appends an item to a submenu panel.
   *
   * @param parent - Parent element.
   * @param name - Item identifier.
   * @param label - Default label.
   * @param icon - Icon SVG string.
   * @param handler - Optional click handler.
   * @param danger - Optional danger style flag.
   * @returns The created item element.
   */
  private appendPanelItem(
    parent: HTMLElement,
    name: string,
    label: string,
    icon: string,
    handler: (() => void) | null,
    danger = false,
  ): HTMLElement {
    const cssTCS = 'tex-table-control-submenu';
    const eid = this.getEventId();

    const item = make('div', (el: HTMLElement) => {
      addClass(el, cssTCS + '-item');
      data(el, 'name', name);
      if (danger) addClass(el, cssTCS + '-item-danger');
    });

    const iconEl = make('span', (el: HTMLSpanElement) => {
      html(
        el,
        renderIcon(icon, {
          width: 14,
          height: 14,
        }),
      );
    });

    const labelEl = make('span', (el: HTMLSpanElement) => {
      text(el, this.editor.i18n.get(name, label));
    });

    append(item, [iconEl, labelEl]);

    rebind(item, 'click.item' + eid, (evt: Event) => {
      evt.preventDefault();
      evt.stopPropagation();

      if (handler) handler();
    });

    append(parent, item);
    return item;
  }

  /**
   * Synchronizes checked states for Toggle header and Align items.
   *
   * @returns void
   */
  private syncControlsState(): void {
    const cssTCS = 'tex-table-control-submenu';
    const cssC = cssTCS + '-item-checked';

    if (this.toggleHeaderItem && this.activeRow) {
      const firstCell = this.activeRow.querySelector('th, td');
      const isHeader = firstCell?.tagName.toLowerCase() === 'th';

      if (isHeader) addClass(this.toggleHeaderItem, cssC);
      else removeClass(this.toggleHeaderItem, cssC);
    }

    if (this.alignItems && this.activeCell) {
      const currentAlign = (data(this.activeCell, 'align') || 'left') as TableColumnAlign;

      (Object.keys(this.alignItems) as TableColumnAlign[]).forEach((key) => {
        const item = this.alignItems![key];
        if (key === currentAlign) addClass(item, cssC);
        else removeClass(item, cssC);
      });
    }
  }

  /**
   * Forces a synchronous layout reflow on the controls element.
   * Used to make sure subsequent `offsetWidth`/`offsetHeight` reads
   * reflect the freshly rendered submenu DOM.
   *
   * @returns void
   */
  private forceReflow(): void {
    const controls = this.controlsElement;

    if (!controls) return;

    void controls.offsetHeight;
  }

  /**
   * Recalculates the menu position on the next animation frame
   * to account for the freshly rendered DOM. Also forces a reflow
   * to make sure measured dimensions are up-to-date.
   *
   * @returns void
   */
  private refreshControlsPosition(): void {
    this.forceReflow();
    this.updateControlsPosition();

    requestAnimationFrame(() => {
      this.forceReflow();
      this.updateControlsPosition();
    });
  }

  /**
   * Positions the controls menu next to the active cell, clamping it to viewport.
   *
   * @returns void
   */
  private updateControlsPosition(): void {
    const cssTCsV = 'tex-table-controls-visible';

    const controls = this.controlsElement;
    const cell = this.activeCell;
    const contentElement = this.getContentElement();

    if (!controls || !contentElement) return;

    if (!cell || !this.tableElement?.contains(cell)) {
      removeClass(controls, cssTCsV);
      return;
    }

    addClass(controls, cssTCsV);

    const cellRect = cell.getBoundingClientRect();
    const contentRect = contentElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;

    let top = cellRect.bottom - contentRect.top + 6;
    let left = cellRect.left - contentRect.left;

    const menuWidth = controls.offsetWidth || 220;
    const menuHeight = controls.offsetHeight || 0;

    let absLeft = contentRect.left + left;
    let absTop = contentRect.top + top;

    if (absLeft + menuWidth > viewportWidth - margin) {
      absLeft = viewportWidth - menuWidth - margin;
    }
    if (absLeft < margin) {
      absLeft = margin;
    }

    if (absTop + menuHeight > viewportHeight - margin) {
      const aboveTop = cellRect.top - contentRect.top - menuHeight - 6;
      if (cellRect.top - menuHeight - 6 > margin) {
        top = aboveTop;
      } else {
        absTop = viewportHeight - menuHeight - margin;
        top = absTop - contentRect.top;
      }
    }

    left = absLeft - contentRect.left;

    css(controls, {
      top: top,
      left: left,
      maxWidth: viewportWidth - 2 * margin + 'px',
    });

    this.syncControlsState();
  }

  /**
   * Binds events to every table cell.
   *
   * @returns void
   */
  private bindCellEvents(): void {
    const cssTCe = '.tex-table-cell';

    const table = this.tableElement;
    if (!table) return;

    const eid = this.getEventId();

    queryList<HTMLTableCellElement>(cssTCe, table).forEach((cell) => {
      rebind(cell, 'focus.cell' + eid, () => this.onCellActivate(cell));
      rebind(cell, 'click.cell' + eid, () => this.onCellActivate(cell));
    });
  }

  /**
   * Activates a cell and updates menu state.
   *
   * @param cell - Cell element.
   * @returns void
   */
  private onCellActivate(cell: HTMLTableCellElement): void {
    const isNewCell = this.activeCell !== cell;

    this.setActiveCell(cell);

    if (isNewCell) {
      this.closeSubpanel();
      this.applyToAll = false;
    }

    this.updateControlsPosition();
  }

  /**
   * Binds global events: window resize/scroll, outside click.
   *
   * @returns void
   */
  private bindTableEvents(): void {
    const table = this.tableElement;
    if (!table) return;

    const eid = this.getEventId();

    rebind(table, 'mouseleave.menu' + eid, () => {
      if (this.activeCell && document.activeElement === this.activeCell) return;
      if (this.controlsElement && this.controlsElement.matches(':hover')) return;

      this.hideControls();
    });

    const reposition = () => this.updateControlsPosition();
    rebind(window, 'scroll.reposition' + eid, reposition);
    rebind(window, 'resize.reposition' + eid, reposition);

    rebind(
      document,
      'click.rac' + eid,
      (evt: MouseEvent) => {
        const target = evt.target as HTMLElement;
        if (!target) return;

        if (this.tableElement && this.tableElement.contains(target)) return;
        if (this.controlsElement && this.controlsElement.contains(target)) return;
        if (target.closest('.tex-tools') || target.closest('.tex-actions')) return;

        this.resetActive();
      },
      true,
    );
  }

  /**
   * Hides the controls menu and closes the subpanel.
   *
   * @returns void
   */
  private hideControls(): void {
    const cssTCsV = 'tex-table-controls-visible';

    if (!this.controlsElement) return;

    removeClass(this.controlsElement, cssTCsV);
    this.closeSubpanel();
  }

  /**
   * Resets all active states (cell, row, menu).
   *
   * @returns void
   */
  private resetActive(): void {
    const cssTCA = 'tex-table-cell-active';
    const cssTRA = 'tex-table-row-active';

    if (this.activeCell) {
      removeClass(this.activeCell, cssTCA);
      this.activeCell = null;
    }

    if (this.activeRow) {
      removeClass(this.activeRow, cssTRA);
      this.activeRow = null;
    }

    this.applyToAll = false;
    this.hideControls();
  }

  /**
   * Sets the active cell, updating the row and selection state.
   *
   * @param cell - Cell element.
   * @returns void
   */
  private setActiveCell(cell: HTMLTableCellElement): void {
    const cssTCA = 'tex-table-cell-active';
    const cssTRA = 'tex-table-row-active';

    if (this.activeCell && this.activeCell !== cell) {
      removeClass(this.activeCell, cssTCA);
    }
    this.activeCell = cell;
    addClass(cell, cssTCA);

    const row = cell.closest('tr') as HTMLTableRowElement | null;
    if (this.activeRow && this.activeRow !== row) {
      removeClass(this.activeRow, cssTRA);
    }
    if (row) {
      this.activeRow = row;
      addClass(row, cssTRA);
    }

    const { selectionApi } = this.editor;
    const [start, end] = selectionApi.getOffset(cell);

    selectionApi.setState({
      element: cell,
      position: {
        start: Math.max(0, start),
        end: Math.max(0, end),
      },
    });
  }

  /**
   * Moves focus to the next or previous cell in the table.
   *
   * @param direction - 1 for next, -1 for previous.
   * @returns void
   */
  private moveToNextCell(direction: number): void {
    const selTC = '.tex-table-cell';
    const table = this.tableElement;

    if (!table || !this.activeCell) return;

    const allCells = queryList<HTMLTableCellElement>(selTC, table);
    const currentIndex = allCells.indexOf(this.activeCell);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < allCells.length) {
      this.focusCell(allCells[nextIndex]);
    } else if (nextIndex >= allCells.length) {
      this.addRow('below');
      const newCells = queryList<HTMLTableCellElement>(selTC, table);
      const firstNewCell = newCells[currentIndex + 1];
      if (firstNewCell) this.focusCell(firstNewCell);
    }
  }

  /**
   * Moves focus to the cell below the active one, adding a row if needed.
   *
   * @returns void
   */
  private moveToCellBelow(): void {
    const selTC = '.tex-table-cell';
    const selTR = '.tex-table-row';

    const table = this.tableElement;
    if (!table || !this.activeCell) return;

    const allRows = queryList<HTMLTableRowElement>(selTR, table);
    const activeRow = this.activeCell.closest('tr') as HTMLTableRowElement | null;
    if (!activeRow) return;

    const rowIndex = allRows.indexOf(activeRow);
    if (rowIndex === -1) return;

    const activeRowCells = queryList<HTMLTableCellElement>(selTC, activeRow);
    const colIndex = activeRowCells.indexOf(this.activeCell);

    if (rowIndex < allRows.length - 1) {
      const nextRow = allRows[rowIndex + 1];
      const nextRowCells = queryList<HTMLTableCellElement>(selTC, nextRow);
      const targetCell = nextRowCells[colIndex];
      if (targetCell) this.focusCell(targetCell);
    } else {
      this.addRow('below');
      const newRows = queryList<HTMLTableRowElement>(selTR, table);
      const newRow = newRows[newRows.length - 1];
      const newRowCells = queryList<HTMLTableCellElement>(selTC, newRow);
      const targetCell = newRowCells[colIndex];
      if (targetCell) this.focusCell(targetCell);
    }
  }

  /**
   * Focuses a cell: activates it, moves caret, updates menu.
   *
   * @param cell - Cell element.
   * @returns void
   */
  private focusCell(cell: HTMLTableCellElement): void {
    const isNewCell = this.activeCell !== cell;

    this.setActiveCell(cell);
    cell.focus();
    this.setCursorToEnd(cell);

    if (isNewCell) {
      this.closeSubpanel();
      this.applyToAll = false;
    }

    this.updateControlsPosition();
  }

  /**
   * Places the caret at the end of the given cell.
   *
   * @param cell - Cell element.
   * @returns void
   */
  private setCursorToEnd(cell: HTMLElement): void {
    const range = document.createRange();
    const selection = window.getSelection();

    if (!selection) return;

    range.selectNodeContents(cell);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Adds a new row relative to the active one.
   *
   * @param position - 'above' or 'below'.
   * @returns void
   */
  private addRow(position: 'above' | 'below' = 'below'): void {
    const cssTR = 'tex-table-row';
    const selTC = '.tex-table-cell';
    const table = this.tableElement;

    if (!table) return;

    const rows = queryList<HTMLTableRowElement>('.' + cssTR, table);
    const maxRows = this.getConfig('maxRows', 20) as number;

    if (rows.length >= maxRows) {
      this.toasts().add(this.editor.i18n.get('tableMaxRows', 'Maximum rows reached'), { code: 'error' });

      return;
    }

    const firstRow = rows[0];
    const cols = firstRow ? queryList<HTMLTableCellElement>(selTC, firstRow).length : 3;

    const activeRow = this.activeCell?.closest('tr') as HTMLTableRowElement | null;
    const activeRowType: 'th' | 'td' = activeRow && activeRow.querySelector('th') ? 'th' : 'td';

    const tr = make('tr', (el: HTMLTableRowElement) => addClass(el, cssTR));
    for (let i = 0; i < cols; i++) append(tr, this.createCell(activeRowType));

    const tbody = queryList<HTMLElement>('tbody', table)[0];

    if (activeRow) {
      if (position === 'above') activeRow.before(tr);
      else activeRow.after(tr);
    } else if (tbody) {
      append(tbody, tr);
    }

    this.bindCellEvents();

    const newRowCells = queryList<HTMLTableCellElement>(selTC, tr);
    const focusTarget = newRowCells[0];
    if (focusTarget) this.focusCell(focusTarget);

    this.change(
      'tableAddRow',
      { table, position },
      {
        blockElement: this.getElement(),
        contentElement: this.getContentElement(),
      },
    );

    setTimeout(() => this.updateControlsPosition(), 0);
  }

  /**
   * Adds a new column relative to the active cell.
   *
   * @param position - 'left' or 'right'.
   * @returns void
   */
  private addColumn(position: 'left' | 'right' = 'right'): void {
    const cssTR = 'tex-table-row';
    const selTC = '.tex-table-cell';
    const table = this.tableElement;

    if (!table) return;

    const rows = queryList<HTMLTableRowElement>('.' + cssTR, table);
    if (!rows.length) return;

    const cols = queryList<HTMLTableCellElement>(selTC, rows[0]).length;
    const maxCols = this.getConfig('maxCols', 10) as number;

    if (cols >= maxCols) {
      this.toasts().add(this.editor.i18n.get('tableMaxCols', 'Maximum columns reached'), { code: 'error' });

      return;
    }

    let insertIndex = cols;

    if (this.activeCell) {
      const activeRow = this.activeCell.closest('tr');
      if (activeRow) {
        const cells = queryList<HTMLTableCellElement>(selTC, activeRow);
        const activeIndex = cells.indexOf(this.activeCell);
        insertIndex = position === 'left' ? activeIndex : activeIndex + 1;
      }
    }

    rows.forEach((row) => {
      const cells = queryList<HTMLTableCellElement>(selTC, row);
      const rowType: 'th' | 'td' = cells[0] && cells[0].tagName.toLowerCase() === 'th' ? 'th' : 'td';
      const newCell = this.createCell(rowType);
      if (insertIndex < cells.length) cells[insertIndex].before(newCell);
      else append(row, newCell);
    });

    this.bindCellEvents();

    if (this.activeCell) {
      const activeRow = this.activeCell.closest('tr');
      if (activeRow) {
        const newCells = queryList<HTMLTableCellElement>(selTC, activeRow);
        const focusTarget = newCells[insertIndex];
        if (focusTarget) this.focusCell(focusTarget);
      }
    }

    this.change(
      'tableAddColumn',
      { table, index: insertIndex, position },
      {
        blockElement: this.getElement(),
        contentElement: this.getContentElement(),
      },
    );

    setTimeout(() => this.updateControlsPosition(), 0);
  }

  /**
   * Removes the active row.
   *
   * @returns void
   */
  private removeRow(): void {
    const cssTR = 'tex-table-row';
    const table = this.tableElement;

    if (!table) return;

    const rows = queryList<HTMLTableRowElement>('.' + cssTR, table);

    if (rows.length <= 1) {
      this.toasts().add(this.editor.i18n.get('tableMinRows', 'Cannot remove last row'), { code: 'error' });

      return;
    }

    let rowToRemove: HTMLTableRowElement | null = null;

    if (this.activeCell) rowToRemove = this.activeCell.closest('tr') as HTMLTableRowElement | null;

    if (rowToRemove) {
      const index = rows.indexOf(rowToRemove);
      const colIndex = this.activeCell
        ? queryList<HTMLTableCellElement>('.tex-table-cell', rowToRemove).indexOf(this.activeCell)
        : 0;

      if (this.activeRow === rowToRemove) {
        removeClass(rowToRemove, cssTR + '-active');
        this.activeRow = null;
      }

      rowToRemove.remove();

      const newRows = queryList<HTMLTableRowElement>('.' + cssTR, table);
      const targetRow = newRows[Math.min(index, newRows.length - 1)];

      if (targetRow) {
        const cells = queryList<HTMLTableCellElement>('.tex-table-cell', targetRow);
        const focusTarget = cells[Math.min(colIndex, cells.length - 1)];
        if (focusTarget) this.focusCell(focusTarget);
      }

      this.change(
        'tableRemoveRow',
        { table, index },
        {
          blockElement: this.getElement(),
          contentElement: this.getContentElement(),
        },
      );

      setTimeout(() => this.updateControlsPosition(), 0);
    }
  }

  /**
   * Removes the active column.
   *
   * @returns void
   */
  private removeColumn(): void {
    const selTC = '.tex-table-cell';
    const table = this.tableElement;

    if (!table) return;

    const rows = queryList<HTMLTableRowElement>('.tex-table-row', table);

    if (!rows.length) return;

    const firstRowCells = queryList<HTMLTableCellElement>(selTC, rows[0]);

    if (firstRowCells.length <= 1) {
      this.toasts().add(this.editor.i18n.get('tableMinCols', 'Cannot remove last column'), { code: 'error' });

      return;
    }

    let colIndex = firstRowCells.length - 1;

    if (this.activeCell) {
      const activeRow = this.activeCell.closest('tr');
      if (activeRow) {
        const cells = queryList<HTMLTableCellElement>(selTC, activeRow);
        colIndex = cells.indexOf(this.activeCell);
      }
    }

    rows.forEach((row) => {
      const cells = queryList<HTMLTableCellElement>(selTC, row);
      if (cells[colIndex]) cells[colIndex].remove();
    });

    if (this.activeCell) {
      const activeRow = this.activeCell.closest('tr');
      if (activeRow) {
        const cells = queryList<HTMLTableCellElement>(selTC, activeRow);
        const targetIndex = Math.min(colIndex, cells.length - 1);
        if (cells[targetIndex]) this.focusCell(cells[targetIndex]);
      }
    }

    this.change(
      'tableRemoveColumn',
      { table, index: colIndex },
      {
        blockElement: this.getElement(),
        contentElement: this.getContentElement(),
      },
    );

    setTimeout(() => this.updateControlsPosition(), 0);
  }

  /**
   * Toggles the header type (th/td) for the active row.
   *
   * @returns void
   */
  private toggleRowHeader(): void {
    const selTC = '.tex-table-cell';
    const row = this.activeRow;

    if (!row) return;

    const cells = queryList<HTMLTableCellElement>(selTC, row);
    if (!cells.length) return;

    const currentType = cells[0].tagName.toLowerCase();
    const newType: 'th' | 'td' = currentType === 'th' ? 'td' : 'th';

    let activeIndex = -1;
    cells.forEach((cell, i) => {
      if (cell === this.activeCell) activeIndex = i;
    });

    cells.forEach((cell) => {
      const content = html(cell);
      const align = data(cell, 'align') || '';
      const newCell = this.createCell(newType, content);

      if (align) {
        data(newCell, 'align', align);
        css(newCell, 'textAlign', align);
      }

      cell.replaceWith(newCell);
    });

    this.bindCellEvents();

    const newCells = queryList<HTMLTableCellElement>(selTC, row);
    if (activeIndex >= 0 && newCells[activeIndex]) {
      this.focusCell(newCells[activeIndex]);
    }

    this.change(
      'tableToggleRowHeader',
      { table: this.tableElement, row, cellType: newType },
      {
        blockElement: this.getElement(),
        contentElement: this.getContentElement(),
      },
    );

    setTimeout(() => this.updateControlsPosition(), 0);
  }

  /**
   * Applies alignment depending on `applyToAll` flag.
   *
   * @param align - Alignment value.
   * @returns void
   */
  private applyAlign(align: TableColumnAlign): void {
    if (this.applyToAll) this.setColumnAlign(align);
    else this.setCellAlign(align);
  }

  /**
   * Sets alignment for the whole column of the active cell.
   *
   * @param align - Alignment value.
   * @returns void
   */
  private setColumnAlign(align: TableColumnAlign): void {
    const selTC = '.tex-table-cell';
    const cell = this.activeCell;
    const table = this.tableElement;

    if (!cell || !table) return;

    const rows = queryList<HTMLTableRowElement>('.tex-table-row', table);
    const activeRow = cell.closest('tr') as HTMLTableRowElement;
    const activeCells = queryList<HTMLTableCellElement>(selTC, activeRow);
    const colIndex = activeCells.indexOf(cell);

    rows.forEach((row) => {
      const cells = queryList<HTMLTableCellElement>(selTC, row);
      const target = cells[colIndex];
      if (!target) return;

      if (align === 'left') {
        delete target.dataset.align;
        css(target, 'textAlign', null);
      } else {
        data(target, 'align', align);
        css(target, 'textAlign', align);
      }
    });

    this.change(
      'tableColumnAlign',
      { table, index: colIndex, align },
      {
        blockElement: this.getElement(),
        contentElement: this.getContentElement(),
      },
    );

    setTimeout(() => this.updateControlsPosition(), 0);
  }

  /**
   * Sets alignment for the active cell only.
   *
   * @param align - Alignment value.
   * @returns void
   */
  private setCellAlign(align: TableColumnAlign): void {
    const cell = this.activeCell;
    if (!cell) return;

    if (align === 'left') {
      delete cell.dataset.align;
      css(cell, 'textAlign', null);
    } else {
      data(cell, 'align', align);
      css(cell, 'textAlign', align);
    }

    this.change(
      'tableCellAlign',
      { cell, align },
      {
        blockElement: this.getElement(),
        contentElement: this.getContentElement(),
      },
    );

    setTimeout(() => this.updateControlsPosition(), 0);
  }

  /**
   * Parses a block schema into a create schema.
   *
   * @param item - Block schema.
   * @returns Create schema for the block.
   */
  protected parse(item: BlockSchema): BlockCreateSchema {
    const rowsData = item.data as BlockSchema[];
    const rows: TableRowSchema[] = [];

    if (Array.isArray(rowsData)) {
      rowsData.forEach((rowSchema) => {
        if (rowSchema.type === 'tr' && Array.isArray(rowSchema.data)) {
          const cells: TableRowSchema['cells'] = [];
          (rowSchema.data as BlockSchema[]).forEach((cellSchema) => {
            if (cellSchema.type === 'th' || cellSchema.type === 'td') {
              const align = cellSchema.attr && cellSchema.attr.align ? String(cellSchema.attr.align) : undefined;

              cells.push({
                type: cellSchema.type,
                content: this.cellDataToHtml(cellSchema.data),
                align,
              });
            }
          });
          rows.push({ cells });
        }
      });
    }

    return { ...item, data: rows } as BlockCreateSchema;
  }

  /**
   * Converts cell data (string or nested schema) to HTML.
   *
   * @param cellData - Cell data.
   * @returns HTML string.
   */
  private cellDataToHtml(cellData: BlockSchemaData | undefined): string {
    if (cellData === undefined || cellData === null) return '';
    if (typeof cellData === 'string') return cellData;

    if (Array.isArray(cellData)) {
      return cellData
        .map((item) => {
          if (typeof item === 'string') return item;

          if (typeof item === 'object' && item !== null) {
            const schema = item as BlockSchema;
            const tag = schema.type;
            const content = this.cellDataToHtml(schema.data);
            const attrs = schema.attr
              ? Object.entries(schema.attr)
                  .map(([k, v]) => `${k}="${v}"`)
                  .join(' ')
              : '';
            return `<${tag}${attrs ? ' ' + attrs : ''}>${content}</${tag}>`;
          }

          return '';
        })
        .join('');
    }

    return '';
  }

  /**
   * Saves the block schema from the DOM.
   *
   * @param blockSchema - Base block schema.
   * @param _blockElement - Block element (unused).
   * @param _strictMode - Strict mode flag (unused).
   * @returns Saved block schema.
   */
  protected save(blockSchema: BlockSchema, _blockElement?: BlockElement, _strictMode?: boolean): BlockSchema {
    const table = this.tableElement;
    if (!table) return { ...blockSchema, data: [] };

    const rows = queryList<HTMLTableRowElement>('.tex-table-row', table);
    const out: BlockSchema[] = [];

    rows.forEach((row) => {
      const cells = queryList<HTMLTableCellElement>('.tex-table-cell', row);
      const rowData: BlockSchema = { type: 'tr', data: [] };

      cells.forEach((cell) => {
        const cellType = cell.tagName.toLowerCase();
        const cellContent = html(cell);

        const parsedData = this.editor.blockManager.htmlToData(cellContent);

        const cellData: BlockSchema = { type: cellType } as BlockSchema;

        if (parsedData.length && !(parsedData.length === 1 && parsedData[0] === '')) {
          cellData.data = parsedData as BlockSchemaData;
        }

        const align = data(cell, 'align');
        if (align && align !== 'left') {
          cellData.attr = { align };
        }

        (rowData.data as BlockSchema[]).push(cellData);
      });

      out.push(rowData);
    });

    return { ...blockSchema, data: out as BlockSchemaData };
  }

  /**
   * Hook called after the block is mounted to the DOM.
   *
   * @param _el - The mounted block element.
   * @returns void
   */
  protected onMount(_el: BlockElement): void {
    this.bindCellEvents();
    this.bindTableEvents();
  }

  /**
   * Hook called on click inside the block.
   *
   * @param evt - Mouse event.
   * @returns void
   */
  protected onClick(evt: MouseEvent): void {
    const target = evt.target as HTMLElement;
    if (!target) return;

    const cell = target.closest('.tex-table-cell') as HTMLTableCellElement | null;
    if (cell && this.tableElement && this.tableElement.contains(cell)) {
      this.onCellActivate(cell);
    }
  }

  /**
   * Hook called on selection change inside the block.
   *
   * @param _evt - Selection change event.
   * @param range - Current range.
   * @returns True if the selection is handled, false otherwise.
   */
  protected onSelectionChange(_evt: Event, range: Range): boolean {
    const startNode =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement)
        : (range.commonAncestorContainer.parentElement as HTMLElement | null);

    const cell = startNode?.closest('.tex-table-cell') as HTMLTableCellElement | null;

    this.updateControlsPosition();

    if (!cell) {
      this.editor.tools.hide();
      this.resetActive();
      this.editor.selectionApi.clearState();
      return false;
    }

    const isNewCell = this.activeCell !== cell;

    this.setActiveCell(cell);

    if (isNewCell) {
      this.closeSubpanel();
      this.applyToAll = false;
    }

    const { selectionApi } = this.editor;
    const [start, end] = selectionApi.getOffset(cell);

    selectionApi.setState({
      element: cell,
      position: {
        start: Math.max(0, start),
        end: Math.max(0, end),
      },
    });

    this.updateControlsPosition();

    return true;
  }

  /**
   * Hook for keydown on the block — swallows the event.
   *
   * @param evt - Keyboard event.
   * @returns False to prevent default handling.
   */
  protected onKeyDown(evt: KeyboardEvent): boolean {
    const { key, ctrlKey, metaKey, shiftKey } = evt;
    const isMod = ctrlKey || metaKey;

    if (key === 'Tab') {
      evt.preventDefault();
      evt.stopPropagation();
      this.moveToNextCell(shiftKey ? -1 : 1);
      return false;
    }

    if (key === 'Enter' && !shiftKey && !isMod) {
      evt.preventDefault();
      evt.stopPropagation();
      this.moveToCellBelow();
      return false;
    }

    if (isMod && key === 'Enter' && !shiftKey) {
      evt.preventDefault();
      evt.stopPropagation();
      this.addRow('below');
      return false;
    }

    if (isMod && shiftKey && key === 'Enter') {
      evt.preventDefault();
      evt.stopPropagation();
      this.addColumn('right');
      return false;
    }

    evt.stopPropagation();
    this.updateControlsPosition();
    return true;
  }

  /**
   * Hook for keyup on the block — swallows the event.
   *
   * @param _evt - Keyboard event.
   * @returns False to prevent default handling.
   */
  protected onKeyUp(_evt: KeyboardEvent): boolean {
    return false;
  }

  /**
   * Hook for paste on the block — swallows the event.
   *
   * @param _evt - Clipboard event.
   * @param map - Paste data map
   * @returns False to prevent default handling.
   */
  protected onPaste(_evt: Event, map: PasteMap): boolean {
    if (map.schema == 'block') map.schema = 'node';

    return true;
  }

  /**
   * Returns the list of elements to sanitize (all table cells).
   *
   * @returns Array of HTMLElements.
   */
  toSanitize(): HTMLElement[] {
    const table = this.tableElement;

    if (!table) return [];

    return queryList<HTMLTableCellElement>('.tex-table-cell', table);
  }

  /**
   * Checks whether the table block is empty.
   *
   * @returns True if the table is empty.
   */
  isEmpty(): boolean {
    const table = this.tableElement;
    if (!table) return true;

    const cells = queryList<HTMLTableCellElement>('.tex-table-cell', table);
    if (!cells.length) return true;

    return cells.every((cell) => {
      const content = html(cell).trim();
      return !content || content === '<br>';
    });
  }

  /**
   * Hook called before the block is destroyed.
   *
   * @returns void
   */
  protected parentDestroy(): void {
    const eid = this.getEventId();

    if (this.tableElement) {
      query<HTMLTableCellElement>(
        '.tex-table-cell',
        (cell) => {
          off(cell, 'focus.cell' + eid);
          off(cell, 'click.cell' + eid);
          off(cell, 'paste.cell' + eid);
        },
        this.tableElement,
      );

      off(this.tableElement, 'mouseleave.menu' + eid);
    }

    off(window, 'scroll.reposition' + eid);
    off(window, 'resize.reposition' + eid);
    off(document, 'click.rac' + eid, true);

    query<HTMLDivElement>(
      '.tex-table-control-trigger',
      (t) => off(t as HTMLElement, 'click.trigger' + eid),
      this.getElement(),
    );

    query<HTMLDivElement>(
      '.tex-table-control-submenu-item',
      (i) => off(i as HTMLElement, 'click.item' + eid),
      this.getElement(),
    );

    this.activeCell = null;
    this.activeRow = null;
    this.tableElement = null;
    this.controlsElement = null;
    this.controlsPanel = null;
    this.controlsSubpanel = null;
    this.toggleHeaderItem = null;
    this.alignItems = null;
    this.applyToAll = false;
  }
}
