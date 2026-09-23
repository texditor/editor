import type {
  BlockModelConfig,
  BlockElement,
  BlockSchema,
  BlockSchemaData,
  BlockCreateSchema,
  TableRowSchema,
  TableColumnAlign,
} from '@/types';

import BlockModel from '@/core/models/block-model';
import {
  IconTable,
  IconTableToggleHeader,
  IconTableAddRowAbove,
  IconTableAddRowBelow,
  IconTableRemoveRow,
  IconTableAlign,
  IconTableAlignLeft,
  IconTableAlignCenter,
  IconTableAlignRight,
  IconTableAddColumnLeft,
  IconTableAddColumnRight,
  IconTableRemoveColumn,
  IconTableRow,
  IconTableColumn,
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
  hasClass,
  query,
  css,
} from 'snappykit';

import '@/styles/entities/blocks/table.css';

export default class Table extends BlockModel {
  private tableElement: HTMLTableElement | null = null;
  private activeCell: HTMLTableCellElement | null = null;
  private activeRow: HTMLTableRowElement | null = null;
  private controlsElement: HTMLElement | null = null;
  private toggleHeaderItem: HTMLElement | null = null;
  private alignItems: Record<TableColumnAlign, HTMLElement> | null = null;

  protected configure(): Partial<BlockModelConfig> {
    return {
      name: 'table',
      translation: 'table',
      groupCode: 'table',
      tagName: 'div',
      icon: IconTable,
      className: 'tex-table',
      contentClassName: 'tex-table-content',
      editable: false,
      editableItems: false,
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
        attributes: { a: ['href', 'target'] },
        protocols: { a: { href: ['https', 'ftp', 'http', 'mailto'] } },
      },

      defaultRows: 3,
      defaultCols: 3,
      maxRows: 20,
      maxCols: 10,
      withHeader: true,
    };
  }

  getEventId(): string {
    return 'table-' + this.editor.events.getEventId();
  }

  protected compose(createSchema?: BlockCreateSchema): BlockElement {
    const blockElement = this.getElement();
    const contentElement = this.getContentElement();
    if (!contentElement) return blockElement;

    html(contentElement, '');

    const table = make('table', (el: HTMLTableElement) => {
      addClass(el, 'tex-table-grid');
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

  private fillFromSchema(tbody: HTMLElement, schema: TableRowSchema[]): void {
    schema.forEach((rowSchema) => {
      const tr = make('tr', (el: HTMLTableRowElement) => {
        addClass(el, 'tex-table-row');
      });

      const rowType: 'th' | 'td' = rowSchema.cells[0]?.type === 'th' ? 'th' : 'td';

      rowSchema.cells.forEach((cellData) => {
        const cell = this.createCell(rowType);
        if (!isEmptyString(cellData.content)) html(cell, cellData.content);
        if (cellData.align) {
          data(cell, 'align', cellData.align);
          cell.style.textAlign = cellData.align;
        }
        append(tr, cell);
      });

      append(tbody, tr);
    });
  }

  private fillDefault(tbody: HTMLElement): void {
    const defaultRows = this.getConfig('defaultRows', 3) as number;
    const defaultCols = this.getConfig('defaultCols', 3) as number;
    const withHeader = this.getConfig('withHeader', true) as boolean;

    for (let row = 0; row < defaultRows; row++) {
      const tr = make('tr', (el: HTMLTableRowElement) => {
        addClass(el, 'tex-table-row');
      });

      const cellType: 'th' | 'td' = row === 0 && withHeader ? 'th' : 'td';

      for (let col = 0; col < defaultCols; col++) {
        append(tr, this.createCell(cellType));
      }

      append(tbody, tr);
    }
  }

  private createCell(cellType: 'th' | 'td', content: string = ''): HTMLTableCellElement {
    const cell = make(cellType) as HTMLTableCellElement;

    addClass(cell, 'tex-table-cell');
    addClass(cell, 'tex-table-cell-' + cellType);

    cell.contentEditable = 'true';
    data(cell, 'cellType', cellType);

    if (!isEmptyString(content)) html(cell, content);

    return cell;
  }

  private createControls(contentElement: HTMLElement): void {
    const cssTC = 'tex-table-control';
    const wrap = make('div', (el: HTMLElement) => addClass(
      el, cssTC + 's tex-animate-fadeIn'
    ));

    const rowTrigger = this.makeTrigger('row', 'Row', IconTableRow);
    const rowSubmenu = this.makeSubmenu();

    this.toggleHeaderItem = this.appendMenuItem(
      rowSubmenu,
      'rowToggleHeader',
      'Toggle header',
      IconTableToggleHeader,
      () => this.toggleRowHeader(),
    );

    this.appendMenuItem(
      rowSubmenu,
      'rowAddAbove',
      'Add above',
      IconTableAddRowAbove,
      () => this.addRow('above')
    );

    this.appendMenuItem(
      rowSubmenu,
      'rowAddBelow',
      'Add below',
      IconTableAddRowBelow,
      () => this.addRow('below')
    );

    this.appendMenuItem(
      rowSubmenu,
      'rowRemove',
      'Remove row',
      IconTableRemoveRow,
      () => this.removeRow(),
      true
    );

    append(rowTrigger, rowSubmenu);

    const colTrigger = this.makeTrigger('column', 'Column', IconTableColumn);
    const colSubmenu = this.makeSubmenu();

    const alignItem = this.appendMenuItem(
      colSubmenu,
      'columnAlign',
      'Align',
      IconTableAlign,
      null
    );

    addClass(alignItem, cssTC + '-submenu-item-parent');

    const alignSubmenu = this.makeSubmenu();

    addClass(alignSubmenu, cssTC + '-submenu-nested');

    const alignLeftItem = this.appendMenuItem(
      alignSubmenu,
      'columnAlignLeft',
      'Left',
      IconTableAlignLeft,
      () => this.setColumnAlign('left'),
    );

    const alignCenterItem = this.appendMenuItem(
      alignSubmenu,
      'columnAlignCenter',
      'Center',
      IconTableAlignCenter,
      () => this.setColumnAlign('center'),
    );

    const alignRightItem = this.appendMenuItem(
      alignSubmenu,
      'columnAlignRight',
      'Right',
      IconTableAlignRight,
      () => this.setColumnAlign('right'),
    );

    this.alignItems = {
      left: alignLeftItem,
      center: alignCenterItem,
      right: alignRightItem,
    };

    append(alignItem, alignSubmenu);

    this.appendMenuItem(
      colSubmenu,
      'columnAddLeft',
      'Add left',
      IconTableAddColumnLeft,
      () => this.addColumn('left')
    );

    this.appendMenuItem(
      colSubmenu,
      'columnAddRight',
      'Add right',
      IconTableAddColumnRight,
      () => this.addColumn('right'),
    );

    this.appendMenuItem(
      colSubmenu,
      'columnRemove',
      'Remove column',
      IconTableRemoveColumn,
      () => this.removeColumn(),
      true
    );

    append(colTrigger, colSubmenu);
    append(wrap, [rowTrigger, colTrigger]);

    this.controlsElement = wrap;
    append(contentElement, wrap);
  }

  private makeTrigger(
    name: string,
    label: string,
    icon: string
  ): HTMLElement {
    const cssTС = 'tex-table-control';
    const cssTСT = cssTС + '-trigger';
    const cssTС_SV = cssTС + '-submenu-visible';

    const item = make('div', (el: HTMLElement) => {
      addClass(el, cssTСT);
      data(el, 'name', name);
    });

    const iconEl = make('span', (el: HTMLSpanElement) => {
      addClass(el, cssTСT + '-icon');
      html(el, renderIcon(icon, { width: 14, height: 14 }));
    });

    const labelEl = make('span', (el: HTMLSpanElement) => {
      addClass(el, cssTС + '-trigger-label');
      el.textContent = this.editor.i18n.get(name, label);
    });

    const arrow = make('span', (el: HTMLSpanElement) => {
      addClass(el, cssTСT + '-arrow');
      el.textContent = '▸';
    });

    append(item, [iconEl, labelEl, arrow]);

    rebind(item, 'click.trigger' + this.getEventId(), (evt: Event) => {
      const target = evt.target as HTMLElement;

      if (target.closest('.' + cssTС + '-submenu')) return;

      evt.preventDefault();
      evt.stopPropagation();

      const [submenu] = queryList<HTMLElement>(
        ':scope > .' + cssTС + '-submenu',
        item
      );

      if (!submenu) return;

      const isOpen = hasClass(submenu, cssTС_SV);

      this.collapseSubmenus();

      if (!isOpen) {
        addClass(submenu, cssTС_SV);
        addClass(item, cssTСT + '-active');
      }
    });

    return item;
  }

  private makeSubmenu(): HTMLElement {
    return make(
      'div',
      (el: HTMLElement) => addClass(
        el,
        'tex-table-control-submenu'
      )
    );
  }

  private appendMenuItem(
    parent: HTMLElement,
    name: string,
    label: string,
    icon: string,
    handler: (() => void) | null,
    danger = false,
  ): HTMLElement {
    const cssTCS = 'tex-table-control-submenu';

    const item = make('div', (el: HTMLElement) => {
      addClass(el, cssTCS + '-item');
      data(el, 'name', name);
      if (danger) addClass(el, cssTCS + '-item-danger');
    });

    const iconEl = make('span', (el: HTMLSpanElement) => {
      addClass(el, cssTCS + '-item-icon');
      html(el, renderIcon(icon, { width: 14, height: 14 }));
    });

    const labelEl = make('span', (el: HTMLSpanElement) => {
      addClass(el, cssTCS + '-item-label');
      el.textContent = this.editor.i18n.get(name, label);
    });

    append(item, [iconEl, labelEl]);

    rebind(item, 'click.item' + this.getEventId(), (evt: Event) => {
      const target = evt.target as HTMLElement;

      const [nestedSub] = queryList<HTMLElement>(':scope > .' + cssTCS, item);

      if (nestedSub && target.closest('.' + cssTCS) === nestedSub) {
        return;
      }

      evt.preventDefault();
      evt.stopPropagation();

      if (nestedSub) {
        const isOpen = hasClass(nestedSub, cssTCS + '-visible');

        if (parent) {
          query<HTMLElement>(
            ':scope > .' + cssTCS + '-item > .' + cssTCS + '-visible',
            (sm) => {
              if (sm !== nestedSub) removeClass(sm, cssTCS + '-visible');
            }, parent
          );

          query<HTMLElement>(
            ':scope > .' + cssTCS + '-item-active',
            (i) => {
              if (i !== item) removeClass(i, cssTCS + '-item-active');
            }, parent
          );
        }

        if (!isOpen) {
          addClass(nestedSub, cssTCS + '-visible');
          addClass(item, cssTCS + '-item-active');
        } else {
          removeClass(nestedSub, cssTCS + '-visible');
          removeClass(item, cssTCS + '-item-active');
        }
        return;
      }

      if (handler) {
        handler();
        this.hideControls();
      }
    });

    append(parent, item);
    return item;
  }

  private collapseSubmenus(): void {
    if (!this.controlsElement) return;

    const cssTC = 'tex-table-control';
    const cssTCS = cssTC + '-submenu';

    query<HTMLElement>('.' + cssTCS + '-visible', (sm) => {
      removeClass(sm, cssTCS + '-visible');
    }, this.controlsElement);

    query<HTMLElement>('.' + cssTC + '-trigger-active', (t) => {
      removeClass(t, cssTC + '-trigger-active');
    }, this.controlsElement);

    query<HTMLElement>('.' + cssTCS + '-item-active', (i) => {
      removeClass(i, cssTCS + '-item-active');
    }, this.controlsElement);
  }

  private syncControlsState(): void {
    const cssTC_SI = 'tex-table-control-submenu-item'

    if (this.toggleHeaderItem && this.activeRow) {
      const firstCell = this.activeRow.querySelector('th, td');
      const isHeader = firstCell?.tagName.toLowerCase() === 'th';

      if (isHeader) addClass(this.toggleHeaderItem, cssTC_SI + '-checked');
      else removeClass(this.toggleHeaderItem, cssTC_SI + '-checked');
    }

    if (this.alignItems && this.activeCell) {
      const currentAlign = (data(this.activeCell, 'align') || 'left') as TableColumnAlign;

      (Object.keys(this.alignItems) as Array<TableColumnAlign>).forEach((key) => {
        const item = this.alignItems![key];

        if (key === currentAlign)
          addClass(item, cssTC_SI + '-checked');
        else
          removeClass(item, cssTC_SI + '-checked');
      });
    }
  }

  private updateControlsPosition(): void {
    const controls = this.controlsElement;
    const cell = this.activeCell;
    const contentElement = this.getContentElement();
    const cssTCV = 'tex-table-controls-visible';

    if (!controls || !contentElement) return;

    if (!cell || !this.tableElement?.contains(cell)) {
      removeClass(controls, cssTCV);
      return;
    }

    addClass(controls, cssTCV);

    const cellRect = cell.getBoundingClientRect();
    const contentRect = contentElement.getBoundingClientRect();

    css(controls, {
      top: cellRect.bottom - contentRect.top + 6,
      left: cellRect.left - contentRect.left
    })

    this.syncControlsState();
  }


  private bindCellEvents(): void {
    const table = this.tableElement;

    if (!table) return;

    const eid = this.getEventId();

    queryList<HTMLTableCellElement>('.tex-table-cell', table).forEach((cell) => {
      rebind(cell, 'focus.cell' + eid, () => this.onCellActivate(cell));
      rebind(cell, 'click.cell' + eid, () => this.onCellActivate(cell));

      rebind(cell, 'input.cell' + eid, () => {
        this.updateControlsPosition();
        this.change(
          'tableCellInput',
          { table: this.tableElement, cell },
          {
            blockElement: this.getElement(),
            contentElement: this.getContentElement(),
          },
        );
      });

      rebind(
        cell,
        'keydown.cell' + eid,
        (evt: Event) => this.onCellKeyDown(evt as KeyboardEvent, cell)
      );
    });
  }

  private onCellActivate(cell: HTMLTableCellElement): void {
    const isNewCell = this.activeCell !== cell;

    this.setActiveCell(cell);

    if (isNewCell) this.collapseSubmenus();

    this.updateControlsPosition();
  }

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

    rebind(document, 'click.rac', (evt: MouseEvent) => {
      const target = evt.target as HTMLElement;
      if (!target) return;

      if (this.tableElement && this.tableElement.contains(target)) return;
      if (this.controlsElement && this.controlsElement.contains(target)) return;
      if (target.closest('.tex-tools') || target.closest('.tex-actions')) return;

      this.resetActive();
    }, true)
  }

  private hideControls(): void {
    if (!this.controlsElement) return;

    removeClass(this.controlsElement, 'tex-table-controls-visible');
    this.collapseSubmenus();
  }

  private resetActive(): void {
    const cssTCA = 'tex-table-cell-active';

    if (this.activeCell) {
      removeClass(this.activeCell, cssTCA);
      this.activeCell = null;
    }

    if (this.activeRow) {
      removeClass(this.activeRow, cssTCA);
      this.activeRow = null;
    }

    this.hideControls();
  }

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
        end: Math.max(0, end)
      },
    });
  }

  private onCellKeyDown(evt: KeyboardEvent, _cell: HTMLTableCellElement): boolean {
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

    if (key === 'Backspace' || key === 'Delete') {
      const content = html(_cell).trim();
      const isEmpty = !content || content === '<br>';

      if (isEmpty) {
        evt.preventDefault();
        evt.stopPropagation();
        return false;
      }

      evt.stopPropagation();

      setTimeout(() => this.updateControlsPosition(), 0);
      return true;
    }

    evt.stopPropagation();

    setTimeout(() => this.updateControlsPosition(), 0);
    return true;
  }

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

  private moveToCellBelow(): void {
    const selTC = '.tex-table-cell',
      selTR = '.tex-table-row';

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

  private focusCell(cell: HTMLTableCellElement): void {
    const isNewCell = this.activeCell !== cell;

    this.setActiveCell(cell);
    cell.focus();
    this.setCursorToEnd(cell);

    if (isNewCell) this.collapseSubmenus();

    this.updateControlsPosition();
  }

  private setCursorToEnd(cell: HTMLElement): void {
    const range = document.createRange();
    const selection = window.getSelection();
    if (!selection) return;
    range.selectNodeContents(cell);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private addRow(position: 'above' | 'below' = 'below'): void {
    const cssTR = 'tex-table-row';
    const selTC = '.tex-table-cell';
    const table = this.tableElement;

    if (!table) return;

    const rows = queryList<HTMLTableRowElement>('.' + cssTR, table);
    const maxRows = this.getConfig('maxRows', 20) as number;

    if (rows.length >= maxRows) {
      this.toasts().add(
        this.editor.i18n.get('tableMaxRows', 'Maximum rows reached'),
        { code: 'error' }
      );

      return;
    }

    const firstRow = rows[0];
    const cols = firstRow ? queryList<HTMLTableCellElement>(
      selTC,
      firstRow
    ).length : 3;

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

  private removeRow(): void {
    const cssTR = 'tex-table-row';
    const table = this.tableElement;

    if (!table) return;

    const rows = queryList<HTMLTableRowElement>('.' + cssTR, table);

    if (rows.length <= 1) {
      this.toasts().add(
        this.editor.i18n.get('tableMinRows', 'Cannot remove last row'),
        { code: 'error' }
      );

      return;
    }

    let rowToRemove: HTMLTableRowElement | null = null;
    if (this.activeCell) rowToRemove = this.activeCell.closest('tr') as HTMLTableRowElement | null;

    if (rowToRemove) {
      const index = rows.indexOf(rowToRemove);
      const colIndex = this.activeCell
        ? queryList<HTMLTableCellElement>(
          '.tex-table-cell',
          rowToRemove
        ).indexOf(this.activeCell)
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

  private removeColumn(): void {
    const selTC = '.tex-table-cell';
    const table = this.tableElement;

    if (!table) return;

    const rows = queryList<HTMLTableRowElement>('.tex-table-row', table);

    if (!rows.length) return;

    const firstRowCells = queryList<HTMLTableCellElement>(selTC, rows[0]);

    if (firstRowCells.length <= 1) {
      this.toasts().add(
        this.editor.i18n.get('tableMinCols', 'Cannot remove last column'),
        { code: 'error' }
      );

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
        newCell.style.textAlign = align;
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
        target.style.textAlign = '';
      } else {
        data(target, 'align', align);
        target.style.textAlign = align;
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

  // =====================================================================
  // Парсинг и сохранение
  // =====================================================================

  protected parse(item: BlockSchema): BlockCreateSchema {
    const rowsData = item.data as BlockSchema[];
    const rows: TableRowSchema[] = [];

    if (Array.isArray(rowsData)) {
      rowsData.forEach((rowSchema) => {
        if (rowSchema.type === 'tr' && Array.isArray(rowSchema.data)) {
          const cells: TableRowSchema['cells'] = [];
          (rowSchema.data as BlockSchema[]).forEach((cellSchema) => {
            if (cellSchema.type === 'th' || cellSchema.type === 'td') {
              const align = cellSchema.attr && cellSchema.attr.align
                ? String(cellSchema.attr.align)
                : undefined;

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

  protected save(
    blockSchema: BlockSchema,
    _blockElement?: BlockElement,
    _strictMode?: boolean
  ): BlockSchema {
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

        // Если данных нет — НЕ пишем поле data вообще
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

  protected onMount(_el: BlockElement): void {
    this.bindCellEvents();
    this.bindTableEvents();
  }

  protected onClick(evt: MouseEvent): void {
    const target = evt.target as HTMLElement;
    if (!target) return;

    const cell = target.closest('.tex-table-cell') as HTMLTableCellElement | null;
    if (cell && this.tableElement && this.tableElement.contains(cell)) {
      this.onCellActivate(cell);
    }
  }

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

    if (isNewCell) this.collapseSubmenus();

    const { selectionApi } = this.editor;
    const [start, end] = selectionApi.getOffset(cell);

    selectionApi.setState({
      element: cell,
      position: { start: Math.max(0, start), end: Math.max(0, end) },
    });

    this.updateControlsPosition();

    return true;
  }

  protected onKeyDown(_evt: KeyboardEvent): boolean {
    return false;
  }

  protected onKeyUp(_evt: KeyboardEvent): boolean {
    return false;
  }

  protected onPaste(_evt: Event): boolean {
    return false;
  }

  toSanitize(): HTMLElement[] {
    const table = this.tableElement;
    if (!table) return [];
    return queryList<HTMLTableCellElement>('.tex-table-cell', table) as HTMLElement[];
  }

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

  protected parentDestroy(): void {
    const eid = this.getEventId();

    if (this.tableElement) {
      query<HTMLTableCellElement>('.tex-table-cell', (cell) => {
        off(cell, 'focus.cell' + eid);
        off(cell, 'click.cell' + eid);
        off(cell, 'input.cell' + eid);
        off(cell, 'keydown.cell' + eid);
      }, this.tableElement);

      off(this.tableElement, 'mouseleave.menu' + eid);
    }

    off(window, 'scroll.reposition' + eid);
    off(window, 'resize.reposition' + eid);

    query<HTMLDivElement>(
      '.tex-table-control-trigger',
      (t) => off(t as HTMLElement, 'click.trigger' + eid),
      this.getElement()
    );

    query<HTMLDivElement>(
      '.tex-table-control-submenu-item',
      (i) => off(i as HTMLElement, 'click.item' + eid),
      this.getElement()
    )

    this.activeCell = null;
    this.activeRow = null;
    this.tableElement = null;
    this.controlsElement = null;
    this.toggleHeaderItem = null;
    this.alignItems = null;
  }
}