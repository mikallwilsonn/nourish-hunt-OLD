import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import typeAhead from './modules/typeAhead';
import ajaxHeart from './modules/heart';

// autocomplete( $('#address'), $('#lat'), $('#lng') );

typeAhead( $('.search') );

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);