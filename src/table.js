/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import React, {useState, useCallback, useMemo, useEffect} from 'react'
import styles from './table.css'
import Preview from 'part:@sanity/base/preview'
import {FormBuilderInput} from 'part:@sanity/form-builder'
import Dialog from 'part:@sanity/components/dialogs/default'
import {sortableContainer, sortableElement, sortableHandle} from 'react-sortable-hoc'
import DragBarsIcon from 'part:@sanity/base/bars-icon'
import {Button, TextInput, Flex} from '@sanity/ui'
import {IoAddCircleOutline, IoTrash} from 'react-icons/io5'
import {RiLayoutColumnLine, RiLayoutRowLine, RiEditLine} from 'react-icons/ri'
import FocusLock from 'react-focus-lock'

const DragHandle = sortableHandle(() => (
  <td className={styles.dragHandle}>
    <DragBarsIcon />
  </td>
))

const SortableItem = sortableElement(({value}) => (
  <tr className={styles.row}>
    <DragHandle />
    {value}
  </tr>
))

const SortableContainer = sortableContainer(({children}) => {
  return (
    <table className={styles.table}>
      <tbody>{children}</tbody>
    </table>
  )
})

//A text input that only propagates its value when its a valid int, but allows for any input, so as not to interfere with intermediary states like an empty input
//If a new value is received, eg from simultaneous edits, it is updated
const IntInput = ({value, onChange, ...props}) => {
  const [input, setInput] = useState(value)
  useEffect(() => {
    setInput(value)
  }, [value])
  return (
    <TextInput
      {...props}
      value={input}
      onChange={(e) => {
        setInput(e.target.value)
        const num = parseInt(e.target.value, 10)
        if (Number.isInteger(num)) {
          onChange(num)
        }
      }}
    />
  )
}

const RenderCell = React.memo(
  ({
    rowKey,
    cell,
    cellDataType,
    updateStringCell,
    onEvent,
    addCellLeft,
    addCellRight,
    deleteCell,
    activeCell,
    setActiveCell,
    objectEditOpen,
    setObjectEditOpen,
    setRowSpan,
    setColSpan,
  }) => {
    const isStringInput = cellDataType.jsonType === 'string'
    const cellStyles = isStringInput ? styles.textInputCell : styles.objectCell
    const active = activeCell?.rowKey == rowKey && activeCell?.cellKey == cell._key
    return (
      <td
        className={`${cellStyles} ${styles.cell} ${active ? styles.activeCell : ''}`}
        rowSpan={cell.rowSpan}
        colSpan={cell.colSpan}
        valign="top"
        onClick={() => setActiveCell({rowKey, cellKey: cell._key})}
      >
        {isStringInput ? (
          <div onFocus={() => setActiveCell({rowKey, cellKey: cell._key})}>
            <TextInput
              className={styles.textInput}
              border={false}
              value={cell.data}
              onChange={(e) => {
                updateStringCell(e.target.value, rowKey, cell._key)
              }}
            />
          </div>
        ) : (
          <Button
            className={styles.objectInput}
            mode="bleed"
            onClick={() => {
              if (active) {
                setObjectEditOpen(true)
              }
            }}
          >
            <Preview
              className={styles.objectPreview}
              value={cell.data}
              type={cellDataType}
              layout="inline"
            />
          </Button>
        )}
        {active && (
          <Flex justify="space-between" className={styles.cellControls} marginTop={1}>
            <Button
              icon={IoAddCircleOutline}
              mode="bleed"
              onClick={() => addCellLeft(rowKey, cell._key)}
            />
            <Flex>
              <IntInput
                icon={RiLayoutRowLine}
                value={cell.rowSpan}
                size={1}
                border={false}
                onChange={(num) => setRowSpan(num, rowKey, cell._key)}
              />
              <IntInput
                icon={RiLayoutColumnLine}
                value={cell.colSpan}
                size={1}
                border={false}
                onChange={(num) => setColSpan(num, rowKey, cell._key)}
              />
            </Flex>
            <Flex>
              <Button
                icon={IoAddCircleOutline}
                mode="bleed"
                onClick={() => addCellRight(rowKey, cell._key)}
              />
              <Button
                icon={IoTrash}
                mode="bleed"
                onClick={() => {
                  deleteCell(rowKey, cell._key)
                  setObjectEditOpen(false)
                }}
              />
            </Flex>
          </Flex>
        )}
        {active && objectEditOpen && (
          <Dialog
            title={cellDataType.title}
            onClickOutside={() => setObjectEditOpen(false)}
            onClose={() => setObjectEditOpen(false)}
          >
            <FocusLock>
              <FormBuilderInput
                type={cellDataType}
                value={cell.data}
                onChange={(patchEvent) => {
                  const newEvent = ['data', {_key: cell._key}, 'cells', {_key: rowKey}].reduce(
                    (prefixedEvent, pathSeg) => prefixedEvent.prefixAll(pathSeg),
                    patchEvent
                  )
                  return onEvent(newEvent)
                }}
                onBlur={() => {}}
                onFocus={() => {}}
              />
            </FocusLock>
          </Dialog>
        )}
      </td>
    )
  }
)

const Table = ({
  rows,
  updateStringCell,
  onEvent,
  removeRow,
  tableTypes,
  handleSortEnd,
  addCellLeft,
  addCellRight,
  deleteCell,
  setRowSpan,
  setColSpan,
}) => {
  if (!rows || !rows.length) return null
  const {cellDataType: propCellDataType, rowDataType} = tableTypes
  const [objectEditOpen, setObjectEditOpen] = useState(false)
  const [activeCell, setActiveCell] = useState(null)
  const [editRow, setEditRow] = useState(null)

  const cellDataType = useMemo(
    () => ({
      icon: false,
      ...propCellDataType,
    }),
    [propCellDataType]
  )

  // Button to remove row
  const RowRemover = useCallback(
    ({rowKey}) => (
      <td className={styles.rowDelete}>
        <span onClick={() => removeRow(rowKey)} />
      </td>
    ),
    [removeRow]
  )

  const EditRow = useCallback(
    ({rowKey, children}) => (
      <td>
        <Button mode="bleed" icon={RiEditLine} onClick={() => setEditRow(rowKey)} />
        {children}
      </td>
    ),
    [setEditRow]
  )

  return (
    <div className={styles.container}>
      <SortableContainer onSortEnd={handleSortEnd} useDragHandle>
        {rows.map((row, rowIndex) => (
          <SortableItem
            key={row._key}
            index={rowIndex}
            value={
              <>
                {row.cells?.map((cell) => (
                  <RenderCell
                    key={cell._key}
                    {...{
                      cell,
                      rowKey: row._key,
                      cellDataType,
                      objectEditOpen,
                      setObjectEditOpen,
                      updateStringCell,
                      onEvent,
                      addCellLeft,
                      addCellRight,
                      deleteCell,
                      activeCell,
                      setActiveCell,
                      setRowSpan,
                      setColSpan,
                    }}
                  />
                ))}
                {rowDataType && (
                  <EditRow key={`${row._key}-edit`} rowKey={row._key}>
                    {editRow && (
                      <Dialog
                        title={rowDataType.title}
                        onClickOutside={() => setEditRow(null)}
                        onClose={() => setEditRow(null)}
                      >
                        <FocusLock>
                          <FormBuilderInput
                            type={rowDataType}
                            value={row.data}
                            onChange={(patchEvent) => {
                              const newEvent = ['data', {_key: row._key}].reduce(
                                (prefixedEvent, pathSeg) => prefixedEvent.prefixAll(pathSeg),
                                patchEvent
                              )
                              return onEvent(newEvent)
                            }}
                            onBlur={() => {}}
                            onFocus={() => {}}
                          />
                        </FocusLock>
                      </Dialog>
                    )}
                  </EditRow>
                )}
                <RowRemover key={`${row._key}-remover`} rowKey={row._key} />
              </>
            }
          />
        ))}
      </SortableContainer>
    </div>
  )
}

export default Table
