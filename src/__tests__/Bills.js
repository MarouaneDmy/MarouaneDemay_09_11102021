import { screen } from "@testing-library/dom"
import '@testing-library/jest-dom'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from '../containers/Bills.js'
import { ROUTES } from '../constants/routes'
import { localStorageMock } from '../__mocks__/localStorage.js'
import userEvent from '@testing-library/user-event'
import firebase from '../__mocks__/firebase.js'

describe("Given I am connected as an employee", () => {
  // test d'intégration GET
  describe('When I navigate to Bills', () => {
    test('fetches bills from mock API GET', async () => {
      const getSpy = jest.spyOn(firebase, "get")
      const bills = await firebase.get()
      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(bills.data.length).toBe(4)
    })
    test('fetches bills from an API and fails with 404 message error', async () => {
      firebase.get.mockImplementationOnce(() => 
        Promise.reject(new Error('Erreur 404'))
      )
      const html = BillsUI({ error: 'Erreur 404' })
      document.body.innerHTML = html
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test('fetches messages from an API and fails with 500 message error', async () => {
      firebase.get.mockImplementationOnce(() => 
        Promise.reject(new Error('Erreur 500'))
      )
      const html = BillsUI({ error: 'Erreur 500' })
      document.body.innerHTML = html
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      const html = BillsUI({ data: []})
      document.body.innerHTML = html
      //to-do write expect expression
    })
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test('Then the page should display a loading text', () => {
      const html = BillsUI({ loading: true })
      document.body.innerHTML = html
      const loading = screen.getByText(/Loading.../)
      expect(loading).toBeTruthy()
    })

    test('Then the page should display an error element', () => {
      const html = BillsUI({ error: 'some error message' })
      document.body.innerHTML = html
      const error = screen.getByTestId('error-message')
      expect(error).toBeTruthy()
    })

    describe('When I click on the new bill button', () => {
      test('Then it should render a new bill form', () => {
        const html = BillsUI({ data: bills })
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

        const billsObj = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage
        })

        const newBillBtn = screen.getByTestId('btn-new-bill')
        const handleClickNewBill = jest.fn((e) => billsObj.handleClickNewBill(e))
        newBillBtn.addEventListener('click', handleClickNewBill)
        userEvent.click(newBillBtn)
        expect(handleClickNewBill).toHaveBeenCalled()
        expect(screen.getByTestId('form-new-bill')).toBeTruthy()
      })
    })

    describe('When i click on an eye icon', () => {
      test('Then it should render a modal with an image', () => {
        const html = BillsUI({ data: bills })
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
        const billsObj = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage
        })

        $.fn.modal = jest.fn()

        const eyeIcons = screen.getAllByTestId('icon-eye')
        const handleClickIconEye = jest.fn(() => billsObj.handleClickIconEye)
        eyeIcons.forEach((icon) => icon.addEventListener('click', () => handleClickIconEye(icon)))
        userEvent.click(eyeIcons[0])
        expect(handleClickIconEye).toHaveBeenCalled()
        const dialogText = screen.getByText('Justificatif')
        expect(dialogText).toBeTruthy()
      })
    })
  })
})