import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ShopCreationSuccessPopupComponent} from '../shop-creation-success-popup/shop-creation-success-popup.component';
import {NotificationsService} from 'angular2-notifications';
import {CreateShopDto, SlotConfigDto} from '../data/api';
import {ContactTypesEnum} from '../contact-types/available-contact-types';

export class OpeningHours {
  constructor(enabled: boolean = true, from: string = '09:00', to: string = '16:00') {
    this.enabled = enabled;
    this.from = from;
    this.to = to;
  }

  enabled: boolean;
  from: string;
  to: string;
}

export class BusinessHours {
  static readonly POSSIBLE_BUSINESS_HOURS = new Map([
    ['Montag', new OpeningHours()],
    ['Dienstag', new OpeningHours()],
    ['Mittwoch', new OpeningHours()],
    ['Donnerstag', new OpeningHours()],
    ['Freitag', new OpeningHours()],
    ['Samstag', new OpeningHours(false)],
    ['Sonntag', new OpeningHours(false)]
  ]);
}

@Component({
  selector: 'shop-creation-page',
  templateUrl: './shop-creation-page.component.html',
  styleUrls: ['./shop-creation-page.component.css']
})
export class ShopCreationPageComponent implements OnInit {
  nameFormGroup: FormGroup;
  addressFormGroup: FormGroup;
  descriptionFormGroup: FormGroup;
  contactFormGroup = new FormGroup({});
  openingFormGroup = new FormGroup({});
  passwordFormGroup: FormGroup;

  passwordRegex: RegExp = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.{14,})');

  token: string;
  contactTypes = ContactTypesEnum;

  businessHours = BusinessHours;

  days;

  constructor(
    private client: HttpClient,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private matDialog: MatDialog,
    private notificationsService: NotificationsService
  ) {
    this.days = Array.from(this.businessHours.POSSIBLE_BUSINESS_HOURS.keys());
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params.token;
    });
    this.nameFormGroup = this.formBuilder.group({
      nameCtrl: ['', Validators.required],
      businessNameCtrl: ['', Validators.required]
    });
    this.addressFormGroup = this.formBuilder.group({
      streetCtrl: ['', Validators.required],
      zipCtrl: ['', [Validators.required, Validators.pattern(new RegExp(/^\d{5}$/))]],
      cityCtrl: ['', Validators.required],
      suffixCtrl: ''
    });
    this.descriptionFormGroup = this.formBuilder.group({
      descriptionCtrl: ['', Validators.required],
      urlCtrl: ['', [Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?')]]
    });
    this.contactTypes.availableContactTypes.forEach(type => {
      const ctrl = type.toLowerCase() + 'Ctrl';
      this.contactFormGroup.addControl(ctrl, new FormControl(''));
    });
    this.contactFormGroup.setValidators(this.atLeastOneContact());
    Array.from(this.businessHours.POSSIBLE_BUSINESS_HOURS.keys()).forEach((day: string) => {
      const fromCtrl = day + 'FromCtrl';
      const toCtrl = day + 'ToCtrl';
      this.openingFormGroup.addControl(fromCtrl, new FormControl(''));
      this.openingFormGroup.addControl(toCtrl, new FormControl(''));
      this.openingFormGroup.controls[fromCtrl].setValue('09:00');
      this.openingFormGroup.controls[toCtrl].setValue('16:00');
      this.openingFormGroup.addControl('defaultCtrl', new FormControl(''));
      this.openingFormGroup.addControl('pauseCtrl', new FormControl(''));
      this.openingFormGroup.controls.defaultCtrl.setValue(15);
      this.openingFormGroup.controls.pauseCtrl.setValue(5);
    });
    // disable default disabled saturday and sunday controls
    this.openingFormGroup.controls.SamstagFromCtrl.disable();
    this.openingFormGroup.controls.SonntagFromCtrl.disable();
    this.openingFormGroup.controls.SamstagToCtrl.disable();
    this.openingFormGroup.controls.SonntagToCtrl.disable();
    this.passwordFormGroup = this.formBuilder.group({
      passwordCtrl: ['', [Validators.required, Validators.pattern(this.passwordRegex), Validators.minLength(14)]],
      confirmPasswordCtrl: ['', Validators.required]
    }, {validator: this.checkMatchingPasswords('passwordCtrl', 'confirmPasswordCtrl')});
  }

  // Validation password equals confirmed password
  checkMatchingPasswords(passwordKey: string, passwordConfirmationKey: string) {
    return (group: FormGroup) => {
      const passwordInput = group.controls[passwordKey];
      const passwordConfirmationInput = group.controls[passwordConfirmationKey];

      if (passwordInput.value !== passwordConfirmationInput.value) {
        return passwordConfirmationInput.setErrors({notEquivalent: true});

      } else {
        return passwordConfirmationInput.setErrors(null);
      }
    };
  }

  toggleAvailability(day: string): void {
    const businessHoursForDay = this.businessHours.POSSIBLE_BUSINESS_HOURS.get(day);
    businessHoursForDay.enabled = !businessHoursForDay.enabled;
    const fromCtrl = day + 'FromCtrl';
    const toCtrl = day + 'ToCtrl';
    if (businessHoursForDay.enabled) {
      this.openingFormGroup.controls[fromCtrl].enable();
      this.openingFormGroup.controls[toCtrl].enable();
    } else {
      this.openingFormGroup.controls[fromCtrl].disable();
      this.openingFormGroup.controls[toCtrl].disable();
    }
  }

  createShop() {
    console.log('Create shop');
    const createShopRequestDto: CreateShopDto = {};
    createShopRequestDto.ownerName = this.nameFormGroup.get('nameCtrl').value;
    createShopRequestDto.name = this.nameFormGroup.get('businessNameCtrl').value;
    createShopRequestDto.street = this.addressFormGroup.get('streetCtrl').value;
    createShopRequestDto.zipCode = this.addressFormGroup.get('zipCtrl').value;
    createShopRequestDto.city = this.addressFormGroup.get('cityCtrl').value;
    createShopRequestDto.addressSupplement = this.addressFormGroup.get('suffixCtrl').value;
    createShopRequestDto.details = this.descriptionFormGroup.get('descriptionCtrl').value;
    createShopRequestDto.website = this.descriptionFormGroup.get('urlCtrl').value;
    const availableContactTypes: { [key: string]: string; } = {};
    this.contactTypes.availableContactTypes.forEach(contact => {
      const contactCtrl = contact.toLowerCase() + 'Ctrl';
      const value = this.contactFormGroup.get(contactCtrl).value;
      if (value) {
        availableContactTypes[contact] = value;
      }
    });
    createShopRequestDto.contacts = availableContactTypes;
    let slots: SlotConfigDto = {};
    this.businessHours.POSSIBLE_BUSINESS_HOURS.forEach((opening, day) => {
      if (opening.enabled) {
        const fromCtrl = day + 'FromCtrl';
        const toCtrl = day + 'ToCtrl';
        console.log('FromCtrl: ' + fromCtrl);
        slots = setRightSlot(day, this.openingFormGroup.get(fromCtrl).value, this.openingFormGroup.get(toCtrl).value, slots);
      }
    });
    slots.timeBetweenSlots = this.openingFormGroup.get('pauseCtrl').value;
    slots.timePerSlot = this.openingFormGroup.get('defaultCtrl').value;
    createShopRequestDto.slots = slots;
    createShopRequestDto.password = this.passwordFormGroup.get('passwordCtrl').value;
    this.client.post('/api/shop?token=' + this.token, createShopRequestDto).subscribe(() => {
        this.matDialog.open(ShopCreationSuccessPopupComponent, {
          width: '500px',
          data: createShopRequestDto.name
        })
          .afterClosed()
          .subscribe();
      },
      error => {
        console.log('Error creating new shop: ' + error.status + ', ' + error.message + ', ' + error.error.code);
        if (error.status === 400 && error.error.code === 'LOCATION_NOT_FOUND') {
          this.notificationsService.error('Ungültige PLZ', 'Diese Postleitzahl kennen wir leider nicht, hast du dich vertippt?');
        }
        if (error.status === 409 && error.error.code === 'SHOP_ALREADY_EXISTS') {
          this.notificationsService.error(
            'Moment mal...',
            'Du hast dich bereits registriert. Du kannst dich unter Login für Ladenbesitzer anmelden.'
          );
        } else {
          this.notificationsService.error('Tut uns leid!', 'Dein Laden konnte nicht angelegt werden.');
        }
      });
  }

  // Validation at least one contact type set
  private atLeastOneContact = () => {
    return (controlGroup) => {
      const controls = controlGroup.controls;
      if (controls) {
        const theOne = Object.keys(controls).find(key => controls[key].value !== '');
        if (!theOne) {
          return {
            atLeastOneRequired: {
              text: 'Gib mindestens eine Kontaktmöglichkeit an.'
            }
          };
        }
      }
      return null;
    };
  };

}

export function setRightSlot(dayString: string, from: string, to: string, slots: SlotConfigDto) {
  switch (dayString) {
    case 'Montag':
      slots.monday = {
        start: from,
        end: to
      };
      break;
    case 'Dienstag':
      slots.tuesday = {
        start: from,
        end: to
      };
      break;
    case 'Mittwoch':
      slots.wednesday = {
        start: from,
        end: to
      };
      break;
    case 'Donnerstag':
      slots.thursday = {
        start: from,
        end: to
      };
      break;
    case 'Freitag':
      slots.friday = {
        start: from,
        end: to
      };
      break;
    case 'Samstag':
      slots.saturday = {
        start: from,
        end: to
      };
      break;
    case 'Sonntag':
      slots.sunday = {
        start: from,
        end: to
      };
      break;
  }
  return slots;
}
