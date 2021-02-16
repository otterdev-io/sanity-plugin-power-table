/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/prop-types */
import {uuid} from '@sanity/uuid'
import React, {useEffect, useRef, useMemo, useState, useCallback} from 'react'
import Table from './table'
import PatchEvent, {set, unset, insert} from 'part:@sanity/form-builder/patch-event'
import {Flex, Button} from '@sanity/ui'
import FormField from 'part:@sanity/components/formfields/default'
import ConfirmationDialog from 'part:@sanity/components/dialogs/confirm'
import FullScreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import {IoMdAdd, IoMdTrash} from 'react-icons/io'
import FocusLock from 'react-focus-lock'

function getTableTypes(type) {
  const rowTypeObject = type.of[0]
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
  const {type, value, onChange} = props
  const currentValue = useRef(value)
  useEffect(() => {
    currentValue.current = value
  }, [value])

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
        PatchEvent.from(set(stringValue, [{_key: rowKey}, 'cells', {_key: cellKey}, 'data']))
      ),
    [onChange]
  )

  const initializeTable = useCallback(() => {
    // Add a single row with a single empty cell (1 row, 1 column)
    const newValue = [
      {
        _type: [tableTypes.rowTypeName],
        _key: uuid(),
        cells: [newCell()],
      },
    ]
    return onChange(PatchEvent.from(set(newValue)))
  }, [onChange, tableTypes.rowTypeName, tableTypes.cellTypeName, newCell])

  const addRow = useCallback(
    (e) => {
      // If we have an empty table, create a new one
      if (!currentValue.current) return initializeTable()
      const newRow = {
        _type: [tableTypes.rowTypeName],
        _key: uuid(),
        cells: [newCell()],
      }
      return onChange(PatchEvent.from(insert([newRow], 'after', [-1])))
    },
    [onChange, initializeTable, tableTypes.rowTypeName, newCell]
  )

  const addCellLeft = useCallback(
    (rowKey, cellKey) =>
      onChange(
        PatchEvent.from(insert([newCell()], 'before', [{_key: rowKey}, 'cells', {_key: cellKey}]))
      ),
    [newCell]
  )

  const addCellRight = useCallback(
    (rowKey, cellKey) =>
      onChange(
        PatchEvent.from(insert([newCell()], 'after', [{_key: rowKey}, 'cells', {_key: cellKey}]))
      ),
    [newCell]
  )

  const deleteCell = useCallback((rowKey, cellKey) => {
    return onChange(PatchEvent.from(unset([{_key: rowKey}, 'cells', {_key: cellKey}])))
  }, [])

  const removeRow = useCallback((rowKey) => onChange(PatchEvent.from(unset([{_key: rowKey}]))), [
    onChange,
  ])

  const setRowSpan = useCallback(
    (rowSpan, rowKey, cellKey) =>
      onChange(
        PatchEvent.from(set(rowSpan, [{_key: rowKey}, 'cells', {_key: cellKey}, 'rowSpan']))
      ),
    [onChange]
  )

  const setColSpan = useCallback(
    (colSpan, rowKey, cellKey) =>
      onChange(
        PatchEvent.from(set(colSpan, [{_key: rowKey}, 'cells', {_key: cellKey}, 'colSpan']))
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
          unset([{_key: item._key}]),
          insert([item], oldIndex > newIndex ? 'before' : 'after', [{_key: refItem._key}])
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

  const table =
    value && value.length ? (
      <Table
        rows={value}
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
    <Button tone="positive" onClick={initializeTable} text="New Table" />
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
    <div ref={ref}>
      <FormField label={type.title} description={type.description}>
        {editorOpen && (
          <FullScreenDialog
            title={type.title}
            onClose={() => setEditorOpen(false)}
            onEscape={() => setEditorOpen(false)}
          >
            <FocusLock>
              <div>
                {table}
                {buttons}
                {confirmationDialog}
              </div>
            </FocusLock>
          </FullScreenDialog>
        )}
        <Button onClick={() => setEditorOpen(true)} text="Edit Table" />
      </FormField>
    </div>
  )
})

export default TableInput
