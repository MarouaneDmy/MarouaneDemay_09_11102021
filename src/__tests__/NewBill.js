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

// Integration Test for POST
describe('When I post a new bill', () => {
  let newBill
  let bill
  beforeAll(() => {
    const html = NewBillUI()
    document.body.innerHTML = html

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }

    const mockFirestore = {
      bills: jest.fn().mockReturnThis(),
      add: jest.fn().mockImplementation((bill) => Promise.resolve({ data: bill }))
    }

    newBill = new NewBill({
      document,
      onNavigate,
      firestore: mockFirestore,
      localStorage: null
    })
    bill = [
      {
        id: 'BeKy5Mo4jkmdfPGYpTxZ',
        vat: '',
        amount: 100,
        name: 'new test',
        fileName: 'test.jpeg',
        commentary: 'post test',
        pct: 20,
        type: 'Transports',
        email: 'abc@test.com',
        fileUrl:
          'https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…61.jpeg?alt=media&token=7685cd61-c112-42bc-9929-8a799bb82d8b',
        date: '2021-09-02',
        status: 'Pending'
      }
    ]
  })
  test('POST request to firestore', async () => {
    await newBill.createBill(bill)
    expect(newBill.firestore.add).toHaveBeenCalledWith(bill)
  })
  test('POST request to firestore with error on bills fetch', async () => {
    const error = new Error('error')

    jest.spyOn(newBill, 'createBill').mockRejectedValueOnce(error)
    await expect(newBill.createBill(bill)).rejects.toThrow(error)
  })
})
  