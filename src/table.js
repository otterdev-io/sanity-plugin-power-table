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
import {Button, TextInput, Flex, Inline} from '@sanity/ui'
import {IoAddCircleOutline, IoTrash} from 'react-icons/io5'
import {RiLayoutColumnLine, RiLayoutRowLine, RiEditLine} from 'react-icons/ri'

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
    onFocus,
    onBlur,
    focusPath,
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
            <Flex className={styles.cellLeftControls}>
              <Button
                icon={IoAddCircleOutline}
                mode="bleed"
                onClick={() => addCellLeft(rowKey, cell._key)}
              />
              <IntInput
                icon={RiLayoutRowLine}
                value={cell.rowSpan}
                border={false}
                onChange={(num) => setRowSpan(num, rowKey, cell._key)}
                width={1}
              />
              <IntInput
                icon={RiLayoutColumnLine}
                value={cell.colSpan}
                border={false}
                onChange={(num) => setColSpan(num, rowKey, cell._key)}
                width={1}
              />
              <Button
                icon={IoAddCircleOutline}
                mode="bleed"
                onClick={() => addCellRight(rowKey, cell._key)}
              />
            </Flex>
            <Button
              icon={IoTrash}
              mode="bleed"
              onClick={() => {
                deleteCell(rowKey, cell._key)
                setObjectEditOpen(false)
              }}
            />
          </Flex>
        )}
        {active && objectEditOpen && (
          <Dialog
            title={cellDataType.title}
            onClickOutside={() => setObjectEditOpen(false)}
            onClose={() => setObjectEditOpen(false)}
          >
            <FormBuilderInput
              type={cellDataType}
              value={cell.data}
              path={[cell._key]}
              focusPath={focusPath}
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={(patchEvent) => {
                const newEvent = ['data', {_key: cell._key}, 'cells', {_key: rowKey}].reduce(
                  (prefixedEvent, pathSeg) => prefixedEvent.prefixAll(pathSeg),
                  patchEvent
                )
                return onEvent(newEvent)
              }}
            />
          </Dialog>
        )}
      </td>
    )
  }
)

const Table = ({
  table,
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
  onFocus,
  onBlur,
  focusPath,
}) => {
  if (!table?.rows?.length) return null
  const {cellDataType: propCellDataType, rowDataType} = tableTypes
  const [objectEditOpen, setObjectEditOpen] = useState(false)
  const [activeCell, setActiveCell] = useState(null)
  const [editRow, setEditRow] = useState(null)

  useEffect(() => {
    onFocus(focusPath)
  }, [])

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
      <SortableContainer key="container" onSortEnd={handleSortEnd} useDragHandle>
        {table.rows.map((row, rowIndex) => (
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
                      onFocus,
                      onBlur,
                      focusPath,
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
                          path={[cell._key]}
                          focusPath={focusPath}
                          onFocus={onFocus}
                          onBlur={onBlur}
                        />
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
