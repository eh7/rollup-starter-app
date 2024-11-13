import format from 'date-fns/format';

var span = document.querySelector('#time-now-test');

export default function update() {
  span.textContent = format(new Date(), 'h:mm:ssa');
  setTimeout(update, 1000);
}
