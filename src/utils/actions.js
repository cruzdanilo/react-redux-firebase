import { isObject, mapValues } from 'lodash'

/**
 * @description Wrap method call in dispatched actions
 * @param {Function} dispatch - Action dispatch function
 * @param {Object} opts - Options object
 * @param {Function} opts.method - Method to call
 * @param {Array} opts.args - Arguments to call method with
 * @param {Array} opts.types - Action types array ([BEFORE, SUCCESS, FAILURE])
 * @private
 */
export function wrapInDispatch(
  dispatch,
  { ref, meta, method, args = [], types }
) {
  const [requestingType, successType, errorType] = types
  dispatch({
    type: isObject(requestingType) ? requestingType.type : requestingType,
    meta,
    payload: isObject(requestingType) ? requestingType.payload : { args }
  })
  return method(...args)
    .then(payload => {
      dispatch({
        type: isObject(successType) ? successType.type : successType,
        meta,
        payload: isObject(successType) ? successType.payload : payload
      })
      return payload
    })
    .catch(err => {
      dispatch({
        type: errorType,
        meta,
        payload: err
      })
      return Promise.reject(err)
    })
}

/**
 * Function that builds a factory that passes firebase and dispatch as
 * first two arguments.
 * @param  {Object} firebase - Internal firebase instance
 * @param  {Function} dispatch - Redux's dispatch function
 * @return {Function} A wrapper that accepts a function to wrap with firebase
 * and dispatch.
 */
function createWithFirebaseAndDispatch(firebase, dispatch, dispatchFirst) {
  return func => (...args) =>
    func.apply(
      firebase,
      dispatchFirst
        ? [dispatch, firebase, ...args]
        : [firebase, dispatch, ...args]
    )
}

/**
 * Map each action with Firebase and Dispatch. Includes aliasing of actions.
 * @param  {Object} firebase - Internal firebase instance
 * @param  {Function} dispatch - Redux's dispatch function
 * @param  {Object} actions - Action functions to map with firebase and dispatch
 * @param  {Object} reverseActions - Action functions to map with dispatch and firebase (i.e. reverse arg order)
 * @return {Object} Actions mapped with firebase and dispatch
 */
export function mapWithFirebaseAndDispatch(
  firebase,
  dispatch,
  actions,
  reverseActions
) {
  const withFirebaseAndDispatch = createWithFirebaseAndDispatch(
    firebase,
    dispatch
  )
  const withDispatchAndFirebase = createWithFirebaseAndDispatch(
    firebase,
    dispatch,
    true
  )
  return {
    ...mapValues(actions, withFirebaseAndDispatch),
    ...mapValues(reverseActions, withDispatchAndFirebase)
  }
}
