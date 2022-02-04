import React from 'react'
import { Transition } from '@headlessui/react'

const Loader = props => {

    return <Transition 
        show={props.isVisible} 
        className="loading-cover" 
        enter="transition" 
        enterFrom="unmounted" 
        enterTo="mounted" 
        leave="transition" 
        leaveFrom="mounted" 
        leaveTo="unmounted"
    >
        <div className="position-absolute top-50 start-50 translate-middle">
            <div id="loading-spinner" className="spinner-grow" role="status">
                <span className="visually-hidden">Ładowanie...</span>
            </div>
        </div>
    </Transition>
}

export default Loader
