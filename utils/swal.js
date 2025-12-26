import Swal from 'sweetalert2'

export const showConfirm = async (options = {}) => {
  const defaultOptions = {
    title: 'Are you sure?',
    text: 'This action cannot be undone!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#22c55e',
    cancelButtonColor: '#ef4444',
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    ...options,
  }

  return Swal.fire(defaultOptions)
}

export const showSuccess = (title = 'Success!', text = '', timer = 2000) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
  })
}

export const showError = (title = 'Error!', text = 'Something went wrong.') => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#ef4444',
  })
}

export const showInfo = (title = 'Info', text = '') => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonColor: '#3b82f6',
  })
}

export const showWarning = (title = 'Warning!', text = '') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#f59e0b',
  })
}

export const showLoading = (title = 'Loading...', text = 'Please wait') => {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading()
    },
  })
}


export const closeSwal = () => {
  Swal.close()
}

export default Swal

