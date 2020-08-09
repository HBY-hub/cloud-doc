import React, {useState, useEffect, useRef} from 'react'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faSearch, faTimes, faEdit, faTrash} from '@fortawesome/free-solid-svg-icons'
import {faMarkdown,} from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from "../hooks/useContextMenu";
import {getParentNode} from "../utils/helper";

const {remote} = window.require('electron')
const {Menu,MenuItem} = remote


const FileList = (props) => {
    const {files, onFileClick, onSaveEdit, onFileDelete} = props
    const [editStatus, setEditStatus] = useState(false);
    const [value, setValue] = useState('');
    let node = useRef(null)
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)
    const closeSearch = (editItem) => {
        setEditStatus(false)
        setValue('')
        // if we are editing a newly created file, we should delete this file when pressing esc
        if (editItem.isNew) {
            onFileDelete(editItem.id)
        }
    }

    const clickedItem = useContextMenu([
        {
            label: '打开',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    onFileClick(parentElement.dataset.id)
                }
            }
        },
        {
            label: '重命名',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    const { id, title } = parentElement.dataset
                    setEditStatus(id)
                    setValue(title)
                }
            }
        },
        {
            label: '删除',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                if (parentElement) {
                    onFileDelete(parentElement.dataset.id)
                }
            }
        },
    ], '.file-list', [files])

    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus)
        if (enterPressed && editStatus && value.trim() !== '') {
            onSaveEdit(editItem.id, value, editItem.isNew)
            setEditStatus(false)
            setValue('')
        }
        if(escPressed && editStatus) {
            closeSearch(editItem)
        }
    })
    useEffect(() => {
        const newFile = files.find(file => file.isNew)
        if (newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    }, [files])
    useEffect(() => {
        if (editStatus) {
            node.current.focus()
        }
    }, [editStatus])

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li
                        className="list-group-item row bg-light align-items-center d-flex file-item"
                        key={file.id}
                        data-id={file.id}
                        data-title={file.title}
                    >
                        {(file.id !== editStatus && !file.isNew) &&
                        <>
                            <span className="col-2">
                                <FontAwesomeIcon
                                    size="lg"
                                    icon={faMarkdown}
                                />
                            </span>
                            <span
                                className="col-10 c-link"
                                onClick={() => {
                                    onFileClick(file.id)
                                }}
                            >
                                {file.title}
                            </span>
                            {/*<button onClick={()=>{setEditStatus(file.id);setValue(file.title)}}>bianji</button>*/}
                        </>
                        }
                        {((file.id === editStatus) || file.isNew) &&
                        <>
                            <input
                                className="form-control col-10"
                                ref={node}
                                value={value}
                                placeholder="请输入文件名称"
                                onChange={(e) => {
                                    setValue(e.target.value)
                                }}
                            />
                            <button
                                type="button"
                                className="icon-button col-2"
                                onClick={() => {
                                    closeSearch(file)
                                }}
                            >
                                <FontAwesomeIcon
                                    title="关闭"
                                    size="lg"
                                    icon={faTimes}
                                />
                            </button>
                        </>

                        }
                    </li>
                ))
            }
        </ul>
    )
}


FileList.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit: PropTypes.func,
}

export default FileList
