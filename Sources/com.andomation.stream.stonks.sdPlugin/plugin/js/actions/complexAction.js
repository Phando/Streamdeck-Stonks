// const MuteState = Object.freeze({
//   unmuted: 0,
//   muted: 1,
// });

class ComplexAction extends Action {
 
  constructor(){
    super();
    this.type = this.type + ".complex";
  }

}
