import React, {useState} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/FileSearch'
import {v4} from 'uuid';
import FileList from "./components/FileList";
import SimpleMDE from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'

import ButtonBtn from './components/BottomBtn'
import {faFileImport, faPlus, faSave} from "@fortawesome/free-solid-svg-icons";
import TabList from "./components/TabList";
import {flattenArr, objToArr} from "./utils/helper";
import fileHelper from "./utils/fileHelper";
import useIpcRenderer from "./hooks/useIpcRenderer";
//nodejs module
// const { join, basename, extname, dirname } = window.require('path')
// const { remote, ipcRenderer } = window.require('electron')
// const Store = window.require('electron-store')
// const fileStore = new Store({'name': 'Files Data'})
// const settingsStore = new Store({name: 'Settings'})
// const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))

const {join,basename,extname,dirname} = window.require('path')
const {remote} = window.require('electron')
const Store = window.require('electron-store')


const fileStore = new Store({'name': 'hby-doc'})
const settingsStore = new Store({name:"Settings"})
const saveFilesToStore = (files) => {
    const filesStoreObj = objToArr(files).reduce((result, file) => {
        const {id, path, title, createdAt} = file
        result[id] = {
            id,
            path,
            title,
            createdAt
        }
        return result
    }, {})
    fileStore.set('files', filesStoreObj)
}

function App() {
    const [files, setFiles] = useState(fileStore.get('files') || {})
    const [activeFileID, setActiveFileID] = useState('')
    const [openedFileIDs, setOpenedFileIDs] = useState([])
    const [unsavedFileIDs, setUnsavedFileIDs] = useState([])
    const [searchedFiles, setSearchedFiles] = useState([])
    const filesArr = objToArr(files)
    const savedLocation = settingsStore.get('saveFileLocation')||remote.app.getPath('documents')

    const activeFile = files[activeFileID]
    const openedFiles = openedFileIDs.map(openID => {
        return files[openID]
    })
    const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr

    const fileClick = (fileID) => {
        setActiveFileID(fileID)
        const currentFile = files[fileID]
        console.log(currentFile)
        if (!currentFile.isLoaded) {
            fileHelper.readFile(currentFile.path).then(value => {
                const newFile = {...files[fileID], body: value, isLoaded: true}
                console.log(value)
                setFiles({...files, [fileID]: newFile})
            })
        }
        if (!openedFileIDs.includes(fileID)) {
            setOpenedFileIDs([...openedFileIDs, fileID])
        }
    }


    const tabClick = (fileID) => {
        // set current active file
        setActiveFileID(fileID)
    }

    const tabClose = (id) => {
        //remove current id from openedFileIDs
        const tabsWithout = openedFileIDs.filter(fileID => fileID !== id)
        setOpenedFileIDs(tabsWithout)
        // set the active to the first opened tab if still tabs left
        if (tabsWithout.length > 0) {
            setActiveFileID(tabsWithout[0])
        } else {
            setActiveFileID('')
        }
    }

    const fileChange = (id, value) => {
        if(value===files[id].body) return
        const newFile = {...files[id], body: value}
        setFiles({...files, [id]: newFile})
        if (!unsavedFileIDs.includes(id)) {
            setUnsavedFileIDs([...unsavedFileIDs, id])
        }

    }
    const deleteFile = (id) => {
        if (files[id].isNew) {
            const {[id]:value,...afterDelete}=files
            setFiles(afterDelete)
        } else {
            fileHelper.deleteFile(files[id].path).then(() => {
                const {[id]:value,...afterDelete}=files
                setFiles(afterDelete)
                saveFilesToStore(afterDelete)
                tabClose(id)
            })
        }
    }


    const updateFileName = (id, title, isNew) => {
        const newPath = isNew ? join(savedLocation, `${title}.md`)
            : join(dirname(files[id].path), `${title}.md`)
        const modifiedFile = {...files[id], title, isNew: false, path: newPath}
        const newFiles = {...files, [id]: modifiedFile}
        if (isNew) {
            fileHelper.writeFile(newPath, files[id].body).then(() => {
                setFiles(newFiles)
                saveFilesToStore(newFiles)
            })
        } else {
            const oldPath = files[id].path
            fileHelper.renameFile(oldPath, newPath).then(() => {
                setFiles(newFiles)
                saveFilesToStore(newFiles)
            })

        }

    }

    const fileSearch = (keyword) => {
        // filter out the new files based on the keyword
        const newFiles = filesArr.filter(file => file.title.includes(keyword))
        setSearchedFiles(newFiles)
    }

    const createNewFile = () => {
        const newID = v4()
        const newFile = {
            id: newID,
            title: '',
            body: '## 请输出 Markdown',
            createAt: new Date().getTime(),
            isNew: true
        }
        console.log(newID)
        setFiles({...files, [newID]: newFile})
    }
    const saveCurrentFile = () => {
        console.log(activeFile.body)
        console.log(activeFile.path)
        fileHelper.writeFile(activeFile.path,
            activeFile.body
        ).then(() => {
            setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
        })
    }
    const importFiles =()=>{
        remote.dialog.showOpenDialog({
            title: '选择Markdown文件',
            properties: ['openFile', 'multiSelections'],
            filters: [
                {name: 'Markdown files', extensions: ['md']}
            ]
        }).then(result => {
            const paths = result.filePaths
            if(Array.isArray(paths)){
                const filteredPaths = paths.filter(path=>{
                    const alreadyAdded = Object.values(files).find(file=>{
                        return file.path ===path
                    })
                    return !alreadyAdded
                })
                const importFilesArr = filteredPaths.map(path=>{
                    return {
                        id:v4(),
                        title:basename(path,extname(path)),
                        path,
                    }
                })
                const newFiles = {...files,...flattenArr(importFilesArr)}
                setFiles(newFiles)
                saveFilesToStore(newFiles)
                if(importFilesArr.length>0){
                    remote.dialog.showMessageBox({
                        type:"info",
                        title:`成功导入了${importFilesArr.length}个文件`,
                        message:`成功导入了${importFilesArr.length}个文件`,
                    })
                }
            }
        })
    }
    useIpcRenderer({
        'create-new-file': createNewFile,
        'import-file': importFiles,
        'save-edit-file': saveCurrentFile,
        // 'active-file-uploaded': activeFileUploaded,
        // 'file-downloaded': activeFileDownloaded,
        // 'files-uploaded': filesUploaded,
        // 'loading-status': (message, status) => { setLoading(status) }
    })
    return (
        <div className="App container-fluid px-0">
            <div className="row no-gutters">
                <div className="col-3 bg-light left-panel">
                    <FileSearch
                        title='我的文档'
                        onFileSearch={fileSearch}
                    />
                    <FileList
                        files={fileListArr}
                        onFileClick={fileClick}
                        onFileDelete={deleteFile}
                        onSaveEdit={updateFileName}
                    />
                    <div className="row no-gutters button-group">
                        <div className="col">
                            <ButtonBtn
                                icon={faPlus}
                                text="新建"
                                colorClass='btn-primary'
                                onBtnClick={createNewFile}
                            />
                        </div>
                        <div className="col">
                            <ButtonBtn
                                icon={faFileImport}
                                text="导入"
                                colorClass='btn-success'
                                onBtnClick={importFiles}
                            />
                        </div>
                        {/*<div className="col">*/}
                        {/*    <ButtonBtn*/}
                        {/*        icon={faSave}*/}
                        {/*        text="保存"*/}
                        {/*        colorClass='btn-success'*/}
                        {/*        onBtnClick={saveCurrentFile}*/}
                        {/*    />*/}
                        {/*</div>*/}

                    </div>
                </div>
                <div className="col-9  right-panel">
                    {!activeFile &&
                    <div className="start-page">
                        选择或者创建新的 Markdown 文档
                    </div>
                    }
                    {activeFile &&
                    <>
                        <TabList
                            files={openedFiles}
                            onTabClick={tabClick}
                            activeId={activeFileID}
                            unsaveIds={unsavedFileIDs}
                            onCloseTab={tabClose}
                        />
                        <SimpleMDE
                            key={activeFile && activeFile.id}
                            value={activeFile && activeFile.body}
                            onChange={(value) => {
                                fileChange(activeFileID, value)
                            }}
                            options={{
                                minHeight: '515px'
                            }}
                        />
                    </>
                    }
                </div>
            </div>
        </div>
    );
}

export default App;
