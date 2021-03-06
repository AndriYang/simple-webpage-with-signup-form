import React from 'react';
import {shallow} from 'enzyme';
import {SignIn} from '../components/auth/SignIn';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import configureStore from 'redux-mock-store';
import renderer from 'react-test-renderer';


configure({ adapter: new Adapter() });

  describe('When the form is submitted', ()=>{

    let wrapper;
    const mockLoginfn = jest.fn();

    beforeEach(() => {
       wrapper = shallow(<SignIn signIn={mockLoginfn}  />);
     })
    it('should be called with the email and password in the state as arguments', () => {
      //fill in email field with mario@net.com
      wrapper.find('#email').simulate(
        'change',
        {target:
          {id: 'email', value: 'mario@net.com'}

        }
      )

      //fill in password field with test1234
      wrapper.find('#password').simulate(
        'change',
        {target:
          {id: 'password', value: 'test1234'}

        }
      )

      //simulate from submission
      wrapper.find('#loginForm').simulate(
        'submit',
        {preventDefault() {}}
      )
      console.log(mockLoginfn.mock.calls[0][0]);
      //test to see arguments used after its been submitted
      expect(mockLoginfn.mock.calls[0][0]).toEqual(
        {email: 'mario@net.com', password: 'test1234'}
      )
    })

    it('check email setState', () => {
      //fill in email field with mario@net.com
      wrapper = shallow(<SignIn signIn={mockLoginfn}  />);
      wrapper.find('#email').simulate(
        'change',
        {target:
          {id: 'email', value: 'mario@net.com'}
        }
      )
      expect(wrapper.state('email')).toEqual('mario@net.com');
    })

    it('check password setState', () => {
      //fill in email field with mario@net.com
      wrapper = shallow(<SignIn signIn={mockLoginfn}  />);
      wrapper.find('#password').simulate(
        'change',
        {target:
          {id: 'password', value: 'test1234'}
        }
      )
      expect(wrapper.state('password')).toEqual('test1234');
    })

    it('print the initial state',() => {
      const data = new SignIn();
      expect(data).toMatchSnapshot();
    })

    it('print the state',() => {
      const data = new SignIn({email: 'mario@net.com',
      password: 'test1234'});

      expect(data).toMatchSnapshot();
    })


  })
