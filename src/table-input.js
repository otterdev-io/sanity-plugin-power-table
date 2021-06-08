/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/prop-types */
import {uuid} from '@sanity/uuid'
import React, {useEffect, useRef, useMemo, useState, useCallback} from 'react'
import Table from './table'
import PatchEvent, {set, unset, insert} from 'part:@sanity/form-builder/patch-event'
import {ThemeProvider, studioTheme, Flex, Button} from '@sanity/ui'
import FormField from 'part:@sanity/components/formfields/default'
import ConfirmationDialog from 'part:@sanity/components/dialogs/confirm'
import FullScreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import {IoMdAdd, IoMdTrash} from 'react-icons/io'

function getTableTypes(type) {
  const rowTypeObject = type.fields.find((t) => t.name === 'rows').type.of[0]
  const rowDataTypeObject = rowTypeObject.fields.find((r) => r.name === 'data')?.type
  const cellTypeObject = rowTypeObject.fields.find((r) => r.name === 'cells').type.of[0]
  const cellDataTypeObject = cellTypeObject.fields.find((f) => f.name === 'data').type

  return {
    rowTypeName: rowTypeObject.name,
    rowDataType: rowDataTypeObject,
    cellTypeName: cellTypeObject.name,
    cellDataType: cellDataTypeObject,
  }
}

const TableInput = React.forwardRef((props, ref) => {
  const {type, value, onChange, focusPath, onFocus, onBlur} = props

  const [dialog, setDialog] = useState({
    msg: null,
    cb: null,
  })

  const tableTypes = useMemo(() => getTableTypes(type), [type])

  const newCellData = useCallback(
    () =>
      tableTypes.cellDataType.jsonType === 'string'
        ? ''
        : {
            _type: tableTypes.cellDataType.name,
          },
    [tableTypes.cellDataType]
  )

  const newCell = useCallback(
    () => ({
      _type: [tableTypes.cellTypeName],
      _key: uuid(),
      colSpan: 1,
      rowSpan: 1,
      value: newCellData(),
    }),
    [tableTypes.cellTypeName, newCellData]
  )

  const updateStringCell = useCallback(
    (stringValue, rowKey, cellKey) =>
      onChange(
        PatchEvent.from(
          set(stringValue, ['rows', {_key: rowKey}, 'cells', {_key: cellKey}, 'data'])
        )
      ),
    [onChange]
  )

  const initializeTable = useCallback(
    (_key) => {
      // Add a single row with a single empty cell (1 row, 1 column)
      const newValue = {
        _type: type.name,
        _key,
        rows: [
          {
            _type: [tableTypes.rowTypeName],
            _key: uuid(),
            cells: [newCell()],
          },
        ],
      }
      return onChange(PatchEvent.from(set(newValue)))
    },
    [type.name, onChange, tableTypes.rowTypeName, tableTypes.cellTypeName, newCell]
  )

  const addRow = useCallback(
    (e) => {
      // If we have an empty table, create a new one
      if (!value?.rows) return initializeTable(value?._key)
      const newRow = {
        _type: [tableTypes.rowTypeName],
        _key: uuid(),
        cells: [newCell()],
      }
      return onChange(PatchEvent.from(insert([newRow], 'after', ['rows', -1])))
    },
    [onChange, initializeTable, tableTypes.rowTypeName, newCell, value]
  )

  const addCellLeft = useCallback(
    (rowKey, cellKey) =>
      onChange(
        PatchEvent.from(
          insert([newCell()], 'before', ['rows', {_key: rowKey}, 'cells', {_key: cellKey}])
        )
      ),
    [newCell]
  )

  const addCellRight = useCallback(
    (rowKey, cellKey) =>
      onChange(
        PatchEvent.from(
          insert([newCell()], 'after', ['rows', {_key: rowKey}, 'cells', {_key: cellKey}])
        )
      ),
    [newCell]
  )

  const deleteCell = useCallback((rowKey, cellKey) => {
    return onChange(PatchEvent.from(unset(['rows', {_key: rowKey}, 'cells', {_key: cellKey}])))
  }, [])

  const removeRow = useCallback(
    (rowKey) => onChange(PatchEvent.from(unset(['rows', {_key: rowKey}]))),
    [onChange]
  )

  const setRowSpan = useCallback(
    (rowSpan, rowKey, cellKey) =>
      onChange(
        PatchEvent.from(set(rowSpan, ['rows', {_key: rowKey}, 'cells', {_key: cellKey}, 'rowSpan']))
      ),
    [onChange]
  )

  const setColSpan = useCallback(
    (colSpan, rowKey, cellKey) =>
      onChange(
        PatchEvent.from(set(colSpan, ['rows', {_key: rowKey}, 'cells', {_key: cellKey}, 'colSpan']))
      ),
    [onChange]
  )

  const handleSortEnd = useCallback(
    ({newIndex, oldIndex}) => {
      const item = value[oldIndex]
      const refItem = value[newIndex]
      if (!item._key || !refItem._key) {
        // eslint-disable-next-line no-console
        console.error(
          'Neither the item you are moving nor the item you are moving to have a key. Cannot continue.'
        )
        return
      }
      if (oldIndex === newIndex || item._key === refItem._key) {
        return
      }
      onChange(
        PatchEvent.from(
          unset(['rows', {_key: item._key}]),
          insert([item], oldIndex > newIndex ? 'before' : 'after', ['rows', {_key: refItem._key}])
        )
      )
    },
    [value, onChange]
  )

  // Unsets the entire table value
  const clear = useCallback(() => onChange(PatchEvent.from(unset())), [onChange])

  const closeDialog = useCallback(() => {
    setDialog({
      msg: null,
      cb: null,
    })
  }, [])

  const onRemoveRowRequest = useCallback(
    (rowKey) => {
      setDialog({
        msg: 'Are you sure you want to delete the table row?',
        cb: () => {
          removeRow(rowKey)
          closeDialog()
        },
      })
    },
    [removeRow, closeDialog]
  )

  const onClearRequest = useCallback(() => {
    setDialog({
      msg: 'Are you sure you want to clear the table?',
      cb: () => {
        clear()
        closeDialog()
      },
    })
  }, [clear, closeDialog])

  const [editorOpen, setEditorOpen] = useState(false)

  const table = value?.rows?.length ? (
    <Table
      table={value}
      updateStringCell={updateStringCell}
      setRowSpan={setRowSpan}
      setColSpan={setColSpan}
      onEvent={onChange}
      removeRow={onRemoveRowRequest}
      tableTypes={tableTypes}
      handleSortEnd={handleSortEnd}
      addCellLeft={addCellLeft}
      addCellRight={addCellRight}
      deleteCell={deleteCell}
      onFocus={onFocus}
      onBlur={onBlur}
      focusPath={[...(focusPath ?? []), 'table']}
    />
  ) : null

  const buttons = value ? (
    <Flex justify="space-between">
      <Button onClick={addRow} tone="positive" icon={IoMdAdd} text="Add Row" />
      <Button
        tone="critical"
        onClick={onClearRequest}
        icon={IoMdTrash}
        text="Clear"
        marginLeft={2}
      />
    </Flex>
  ) : (
    <Button tone="positive" onClick={() => initializeTable(uuid())} text="New Table" />
  )

  const confirmationDialog =
    dialog.msg && dialog.cb ? (
      <ConfirmationDialog
        onConfirm={dialog.cb}
        onCancel={closeDialog}
        confirmColor="danger"
        confirmButtonText="Confirm"
      >
        {dialog.msg}
      </ConfirmationDialog>
    ) : null

  return (
    <ThemeProvider theme={studioTheme}>
      <div ref={ref}>
        <FormField label={type.title} description={type.description}>
          {editorOpen && (
            <FullScreenDialog
              key="tableDialog"
              title={type.title}
              onClose={() => setEditorOpen(false)}
              onEscape={() => setEditorOpen(false)}
            >
              <div>
                {table}
                {buttons}
                {confirmationDialog}
              </div>
            </FullScreenDialog>
          )}
          <Button onClick={() => setEditorOpen(true)} text="Edit Table" />
        </FormField>
      </div>
    </ThemeProvider>
  )
})

export default TableInput
