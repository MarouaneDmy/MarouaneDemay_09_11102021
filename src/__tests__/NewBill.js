import { fireEvent, screen } from "@testing-library/dom"
import '@testing-library/jest-dom'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES } from '../constants/routes'
import { localStorageMock } from '../__mocks__/localStorage.js'
import userEvent from '@testing-library/user-event'


describe("Given I am connected as an employee", () => {
  let newBill
  beforeAll(() => {
    const html = NewBillUI()
    document.body.innerHTML = html
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee'
      })
    )
    newBill = new NewBill({
      document,
      onNavigate,
      firestore: null,
      localStorage: window.localStorage
    })
  })

  describe('When I am on NewBill Page', () => {
    test('Then it should render the page', () => {
      expect(screen.getByText(/Envoyer une note de frais/i)).toBeInTheDocument()
      expect(screen.getByRole('form')).toBeInTheDocument()
    })
    
    test('Then i can attach a jpg/jpeg/png file to the form via an input', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const input = screen.getByTestId('file')
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      input.addEventListener('change', handleChangeFile)
      userEvent.upload(input, file)
      expect(handleChangeFile).toHaveBeenCalled()
    })

    test('Then i can submit a correctly filled form', () => {
      // required inputs : select (expense-type), date (datepicker), amount (amount), pct (pct), file (file)
      const select = screen.getByTestId('expense-type')
      const dateInput = screen.getByTestId('datepicker')
      const amountInput = screen.getByTestId('amount')
      const pctInput = screen.getByTestId('pct')
      const fileInput = screen.getByTestId('file')
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      userEvent.upload(fileInput, file)
      select.selectedIndex = 1
      dateInput.value = '2021-08-31'
      amountInput.value = '70'
      pctInput.value = '20'
  
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      const form = screen.getByRole('form')
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
})
  