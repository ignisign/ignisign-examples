import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useEffect, useState } from 'react';
import { Button } from '../components/button';
import { useForm } from "react-hook-form";
import { Input } from '../components/input';
import { useUsers } from '../contexts/user.context';
import { faker } from '@faker-js/faker';
import { useSignatureProfiles } from '../contexts/signature-profile.context';
import { COUNTRY_LIST, IGNISIGN_SIGNER_CREATION_INPUT_REF } from '@ignisign/public';
import { MyUser } from '../models/user.front.model';
import { BiUserCircle } from "react-icons/bi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { LoadingSpinner } from '../components/loadingSpinner';
import { HeaderPage } from '../components/headerPage';
import { NoContent } from '../components/noContent';
import { useIgniSnackbar } from '../contexts/snackbar.context';
import { ApiService } from '../services/api.service';

const countriesDataset = COUNTRY_LIST.map(c => ({ label : c.name, value: c.code }));

const getDefaultPhoneNumber = () => process.env.REACT_APP_PHONE ?? '';
const DEFAULT_EMAIL = process.env.REACT_APP_EMAIL ?? '';

//Take a standard email adresse and create a random one by adding a random number before the @
const createRandomEmail = (email) => {
  if(email === '')
    return '';

  const random = Math.floor(Math.random() * (10000 - 1 + 1)) + 1
  const [name, domain] = email.split('@')
  return `${name}+${random}@${domain}`
}

const createFakeBirthDate = () => {
  const birthDate = faker.date.birthdate();
  return `${birthDate.getFullYear()}-${birthDate.getMonth() < 10 ? '0' : ''}${birthDate.getMonth() + 1}-${birthDate.getDate() < 10 ? '0' : ''}${birthDate.getDate()}`
}

const inputs = [
  {label: 'First name',     name: 'firstName',     faker: faker.person.firstName },
  {label: 'Last name',      name: 'lastName',      faker: faker.person.lastName },
  {label: 'Email',          name: 'email',         faker: () => {} },
  {label: 'BirthPlace',     name: 'birthPlace',    faker: faker.location.countryCode  },
  {label: 'Nationality',    name: 'nationality',   faker: createFakeBirthDate,        type: 'select', dataset: countriesDataset},
  {label: 'BirthDate',      name: 'birthDate',     faker: faker.location.city,        type: 'date'},
  {label: 'Phone number',   name: 'phoneNumber',   faker: getDefaultPhoneNumber,      type: 'tel'},
  {label: 'BirthCountry',   name: 'birthCountry',  faker: faker.location.countryCode, type: 'select', dataset: countriesDataset},
]


const UsersPage = () => {
  const { notifyError }                   = useIgniSnackbar();
  const {selectedSignatureProfileId}      = useSignatureProfiles();
  const {addUser, users}                  = useUsers();
  const form                              = useForm();
  const [isOpen, setIsOpen]               = useState<boolean>(false);
  const [inputsLoading, setInputsLoading] = useState<boolean>(false);
  const [inputsNeed, setInputsNeed]       = useState<IGNISIGN_SIGNER_CREATION_INPUT_REF[]>([]);
  const [isLoading, setIsLoading]         = useState<boolean>(false);

  useEffect(() => {
    if(!!selectedSignatureProfileId)
      getInputsNeed();
  }, [selectedSignatureProfileId])
  
  const getInputsNeed = async () => {
    setIsLoading(true);
    try {
      const tmpInputs = await ApiService.getSignatureProfileSignerInputsConstraints(selectedSignatureProfileId);
      console.log('getInputsNeed : ', tmpInputs);
      setInputsNeed(tmpInputs);

      if(isOpen)
        fillForm();
    } catch (e) {
      console.error(e);
      notifyError('Failed to get inputs need for create signer');
    } finally {
      setIsLoading(false);
    }
  }

  const fillForm = () => {
    inputs
      .filter((e : any) => inputsNeed.includes(e.name))
      .forEach((e : any) => {
        form.setValue(e.name, e.faker());
        console.log('RESULT INPUT : ', form.watch('firstName'));
        console.log('RESULT FORM 1 : ', form.getValues());
      });

    console.log('RESULT FORM 2 : ', form.getValues());
    // form.setValue('firstName',    faker.person.firstName())
    // form.setValue('lastName',     faker.person.lastName())
    // form.setValue('phoneNumber',  DEFAULT_PHONE)
    // form.setValue('email',        createRandomEmail(DEFAULT_EMAIL))
    // form.setValue('birthDate',    createFakeBirthDate())
    // form.setValue('birthPlace',   faker.location.city())
    // form.setValue('nationality',  faker.location.countryCode())
    // form.setValue('birthCountry', faker.location.countryCode())
  }

  const openModal = () => {
    if(inputsNeed?.length) 
      fillForm();

    setIsOpen(true)
  }

  const closeModal = () => {
    if(isLoading) 
      return;

    form.reset();
    setIsOpen(false);
  }

  const addUserFromForm = async () => {
    setIsLoading(true)
    try {
      const newUser: any = form.getValues();
      await addUser(newUser);
      closeModal();
    } catch (e) {
      console.error(e);
      notifyError('Failed to add user');
    } finally {
      setIsLoading(false)
    }
    
  }

  if(!users)
    return <div>...Loading</div>
  
  return <>
    <Dialog open={isOpen} fullWidth maxWidth='xs' onClose={() => setIsOpen(false)}>
        <form onSubmit={form.handleSubmit(addUserFromForm)}>
      <DialogTitle>Add user</DialogTitle>
      <DialogContent>
        <div className='w-full'>
          {inputsLoading ?
            <div className='flex justify-center w-full'>
              <LoadingSpinner/> 
            </div> :
            <div className='flex flex-col gap-4 justify-center mt-2'>
              {inputs
                .filter((e : any) => inputsNeed.includes(e.name))
                .map(e => <Input key={e.name} label={e.label} form={form} name={e.name} type={e.type} dataset={e?.dataset || []}/> )}
            </div>
          }
        </div>
      </DialogContent>
      <DialogActions>
        <div className='flex gap-5 items-center justify-between w-full'>
          <Button disabled={isLoading} onClick={closeModal}>Close</Button>
          <Button disabled={inputsLoading} loading={isLoading} type='submit'>Add</Button>
        </div>
      </DialogActions>
        </form>
    </Dialog>

    <HeaderPage
      title='Users'
      subTitle='Manage your users'
      action={users?.length === 0 ? null :
        {
          label: 'Create a user',
          onClick: openModal,
          disabled: !selectedSignatureProfileId
        }
      }
    />

    <div className='flex flex-col gap-3 w-full'>
      { users?.length === 0 ?
          <NoContent
            title='No user'
            description='Create a user to start using Ignisign'
            button={{
              label: 'Create a user',
              onClick: openModal
            }}
          /> :
          users?.map(user => <UserItem key={`user-${user?._id}`} user={user} /> )
      }
    </div>
  </>
}

const UserItem = ({ user } : { user : MyUser }) => {
  const { deleteUser }            = useUsers();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      await deleteUser(userId);
    } catch (e) {
      console.error(e);      
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div key={`user-item-${user._id}`} className='flex gap-5 items-center justify-between shadow bg-gray-900 rounded px-3 py-1'>
      <div className='flex gap-3 items-center'> 
        <span className='text-primary-500'>
          <BiUserCircle size={30}/>
        </span>

        <div>
          <div className='font-bold'>
            {user.firstName} {user.lastName}
          </div>

          <div>
            {user.email}
          </div>
        </div>
      </div>
      
      <div className='cursor-pointer' onClick={()=> handleDeleteUser(user._id)}>
        {isLoading ? 
          <div className='w-14'> 
            <LoadingSpinner/>
          </div> : 
          <span className='text-red-500'>
            <RiDeleteBin6Line size={20} />
          </span>
        }
      </div> 
    </div>
  )
}

export default UsersPage