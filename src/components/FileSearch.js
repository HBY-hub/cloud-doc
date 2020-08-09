import React, {useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSearch,faTimes} from "@fortawesome/free-solid-svg-icons";
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useIpcRenderer from '../hooks/useIpcRenderer'


const FileSearch = ({title,onFileSearch})=>{
    const [inputActive,setInputActive] = useState(false);
    const [value,setValue] = useState('');
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)
    let node  = useRef(null)

    const closeSearch = ()=>{
        setInputActive(false)
        setValue('')
        onFileSearch('')
    }
    useEffect(()=>{
        if (enterPressed && inputActive) {
            onFileSearch(value)
        }
        if(escPressed && inputActive) {
            closeSearch()
        }
        // const handleInputEvent = (event)=>{
        //     const {keyCode} = event
        //     if(keyCode===13&&inputActive){
        //         onFileSearch(value)
        //     }else if(keyCode===27&&inputActive){
        //         closeSearch()
        //     }
        // }
        // document.addEventListener('keyup',handleInputEvent)
        // return ()=>{
        //     document.removeEventListener('keyup',handleInputEvent)
        // }
    })

    useEffect(()=>{
        if(inputActive){
            node.current.focus()
        }
    },[inputActive])

    return (
        <div className='alert alert-primary d-flex justify-content-between align-items-center mb-0'>
            { !inputActive &&
                <>
                    <span>{title}</span>
                    <button
                        type='button'
                        className='icon-button'
                        onClick={()=>{setInputActive(true)}}
                    >
                        <FontAwesomeIcon icon={faSearch} size={"lg"} title="搜索"/>
                    </button>
                </>
            }{
                inputActive&&
                    <div className="row">
                        <input
                            className='form-control col-8'
                            value={value}
                            onChange={(e)=>{setValue(e.target.value)}}
                            ref={node}
                        />
                        <button
                            type="button"
                            className="btn btn-primary col-4"
                            onClick={closeSearch}
                            >
                            <FontAwesomeIcon icon={faTimes} title={"关闭"} size={"lg"}/>
                        </button>
                    </div>
        }
        </div>
    )
}

FileSearch.propTypes = {
    title: PropTypes.string,
    onFileSearch: PropTypes.func.isRequired,
}

FileSearch.defaultProps = {
    title: '我的文档'
}

export default FileSearch
