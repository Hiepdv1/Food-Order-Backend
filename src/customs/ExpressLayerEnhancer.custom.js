import Layer from 'express/lib/router/layer';
import { GlobalErrorHandler } from '../middlewares';
import { HandleRollback } from '../utility/Rollback.utility';

const copyPropsFn = (oldFn, newFn) => {
    Object.keys(oldFn).forEach(key => {
        newFn[key] = oldFn[key];
    })
    return newFn
}

const createNewFn = (fn) => {
    const newFn = function (...args) {
        const call = fn.apply(this, args);
        if (call instanceof Promise) {
            call.catch(err => {
                HandleRollback()
                    .then(() => GlobalErrorHandler(err, ...args))
                    .catch(rollbackError => GlobalErrorHandler(rollbackError, ...args))
            })
        };
        return call
    }

    Object.defineProperty(newFn, 'length', {
        writable: false,
        enumerable: false,
        value: fn.length
    })

    return copyPropsFn(fn, newFn)
}

Object.defineProperty(Layer.prototype, 'handle', {
    enumerable: true,
    get() {
        return this.__handle
    },
    set(fn) {
        fn = createNewFn(fn)
        this.__handle = fn
    }
})
