
const $ = require('jquery');
import Vue from 'vue';



//const relayConfig = require('../../../relay.config').config
//var io = require('socket.io-client');
var web3Utils = require('web3-utils')
var BigNumber = require('bignumber.js')
var ethereumHelper;


const ContractInterface = require('./contract-interface')

var app;
var dashboardData;


var nametagInput;
var namesList;

var recentNamesList;
var personalNamesList;

var tokenIdQuery;
var tokenNameQuery;
var tokenOwnerQuery;

var jumbotron;
var stats;


export default class HomeRenderer {

    init( ethHelper  )
    {

      var self = this;
      ethereumHelper = ethHelper;






      nametagInput = new Vue({
          el: '#nametag-input',
          data: {
             inputName: '',
             showAvailability: false,
             nametagAvailable: true
          },
          methods: {
                keyUp: function (event) {
                   Vue.set(nametagInput, 'showAvailability', false)
                },
                inputChange: function (event) {
                  console.log('input change',  this.inputName, event)

                  self.checkNameAvailability( this.inputName );
                },
                onSubmit: function (event){

                  self.claimName( this.inputName )
                }
            }
        })




    }

    async onWeb3Connected()
    {
      var self = this;
        console.log('on web3 connected')


        tokenIdQuery = new Vue({
            el: '#tokenIdQuery',
            data: {
               queryName: '',
               tokenIdResult: ''
            },
            methods: {
                  onSubmit: function (event){
                    self.queryTokenId( this.queryName )
                  }
              }
          })


          tokenNameQuery = new Vue({
              el: '#tokenNameQuery',
              data: {
                 queryId: '',
                 tokenNameResult: ''
              },
              methods: {
                    onSubmit: function (event){
                      self.queryTokenName( this.queryId )
                    }
                }
            })


            tokenOwnerQuery = new Vue({
                el: '#tokenOwnerQuery',
                data: {
                   queryName: '',
                   ownerResult: '',
                   ownerURL: ''
                },
                methods: {
                      onSubmit: function (event){
                        self.queryTokenOwner( this.queryName )
                      }
                  }
              })

              recentNamesList = new Vue({
                   el: '#recentnameslist',
                   data:{
                     list: []
                    }
                 });

               personalNamesList = new Vue({
                    el: '#personalnameslist',
                    data:{
                      list: []
                     }
                  });





                self.updateRecentNamesList()
                self.updatePersonalNamesList()

                setInterval(function(){ self.updateRecentNamesList()   },24 * 1000)




    }


    async claimName(name)
    {
      var web3 = ethereumHelper.getWeb3Instance();

      var env = 'mainnet'

      var connectedAddress = ethereumHelper.getConnectedAccountAddress()

      var nametagContract = ContractInterface.getNametagContract(web3,env)

      var response =  await new Promise(function (result,error) {
         nametagContract.claimToken.sendTransaction(connectedAddress,name, function(err,res){
            if(err){ return error(err)}

            result(res);
         })
       });


    }

    async queryTokenOwner(name)
    {


            var web3 = ethereumHelper.getWeb3Instance();

             if(!web3) return;

            var env = 'mainnet'

            var nametagContract = ContractInterface.getNametagContract(web3,env)


            var tokenIdRaw =  await new Promise(function (result,error) {
               nametagContract.nameToTokenId.call(name, function(err,res){
                  if(err){ return error(err)}

                  result(res);
               })
             });

             var tokenIdNumber =  new BigNumber(tokenIdRaw).toFixed();

             var tokenOwnerAddress =  await new Promise(function (result,error) {
                nametagContract.ownerOf.call(tokenIdNumber, function(err,res){
                   if(err){ return error(err)}

                   result(res);
                })
              });


             Vue.set(tokenOwnerQuery, 'ownerResult', tokenOwnerAddress)
              Vue.set(tokenOwnerQuery, 'ownerURL', 'https://etherscan.io/address/' + tokenOwnerAddress)


    }

    async queryTokenId(name)
    {


            var web3 = ethereumHelper.getWeb3Instance();

             if(!web3) return;

            var env = 'mainnet'

            var nametagContract = ContractInterface.getNametagContract(web3,env)


            var tokenIdRaw =  await new Promise(function (result,error) {
               nametagContract.nameToTokenId.call(name, function(err,res){
                  if(err){ return error(err)}

                  result(res);
               })
             });

             var tokenIdNumber =  new BigNumber(tokenIdRaw).toFixed();

             Vue.set(tokenIdQuery, 'tokenIdResult', tokenIdNumber)



    }

    async queryTokenName(tokenId)
    {


            var web3 = ethereumHelper.getWeb3Instance();

             if(!web3) return;

            var env = 'mainnet'

            var nametagContract = ContractInterface.getNametagContract(web3,env)


            var tokenName =  await new Promise(function (result,error) {
               nametagContract.tokenURI.call(tokenId, function(err,res){
                  if(err){ return error(err)}

                  result(res);
               })
             });

             Vue.set(tokenNameQuery, 'tokenNameResult', tokenName)

    }


    async checkNameAvailability(name)
    {



      var web3 = ethereumHelper.getWeb3Instance();

       if(!web3) return;

      var env = 'mainnet'

      var nametagContract = ContractInterface.getNametagContract(web3,env)

      console.log(name)

      var tokenIdRaw =  await new Promise(function (result,error) {
         nametagContract.nameToTokenId.call(name, function(err,res){
            if(err){ return error(err)}

            result(res);
         })
       });


       var containsOnlyLower =  await new Promise(function (result,error) {
          nametagContract.containsOnlyLower.call(name, function(err,res){
             if(err){ return error(err)}

             result(res);
          })
        });

        if(!containsOnlyLower)
        {
          Vue.set(nametagInput, 'nametagAvailable', false)
          Vue.set(nametagInput, 'showAvailability', true)

          return
        }


       var tokenIdNumber =  new BigNumber(tokenIdRaw).toFixed();

        console.log(  tokenIdNumber  )

        var tokenOwnerAddress =  await new Promise(function (result,error) {
           nametagContract.ownerOf.call(tokenIdNumber, function(err,res){
              if(err){ return error(err)}

              result(res);
           })
         });



         var hasOwner = tokenOwnerAddress && tokenOwnerAddress != '0x'
           console.log(  hasOwner  )

           Vue.set(nametagInput, 'nametagAvailable', !hasOwner)
           Vue.set(nametagInput, 'showAvailability', true)



    }


    async updatePersonalNamesList()
    {
      var web3 = ethereumHelper.getWeb3Instance();

      var localMetamaskAddress = ethereumHelper.getConnectedAccountAddress();

       if(!web3) return;

       var env = 'mainnet'

       var nametagContract = ContractInterface.getNametagContract(web3,env)
       console.log('update names list', nametagContract)



           var currentEthBlock = await ethereumHelper.getCurrentEthBlockNumber()



            const _CONTRACT_ADDRESS = "0x3c642be0bb6cb9151652b999b26d80155bcea7de"
            const _TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"



              console.log('localMetamaskAddress',localMetamaskAddress)

                  var localMetamaskAddressFixed =  new BigNumber(localMetamaskAddress).toFixed();


                      var personalNames = []



                      /// need to fix from block 
                      await web3.eth.filter({
                        fromBlock: (currentEthBlock - (30 * 1000)),
                            toBlock: currentEthBlock,
                            address: _CONTRACT_ADDRESS,
                            topics: [_TRANSFER_TOPIC, null],
                      }, async function(error,result)  {

                         var fromAddress = result.topics[1];
                         var toAddress = result.topics[2];
                         var tokenIdHex = result.topics[3];
                         var tokenIdNumber =  new BigNumber(tokenIdHex).toFixed();


                     //    var tokenName = await nametagContract.tokenURI.call( )

                         var tokenName =  await new Promise(function (result,error) {
                            nametagContract.tokenURI.call(tokenIdNumber, function(err,res){
                               if(err){ return error(err)}

                               result(res);
                            })
                          });

                          var toAddressFixed =  new BigNumber(toAddress).toFixed();
                          console.log('???', toAddressFixed, localMetamaskAddressFixed)

                         if(toAddressFixed == localMetamaskAddressFixed)
                         {
                           var nameData = {
                             to:  toAddress,
                             tokenIdHex: tokenIdHex,
                             tokenIdNumber: tokenIdNumber,
                             tokenName: tokenName,
                             tokenURL: 'https://etherscan.io/token/'+_CONTRACT_ADDRESS+'?a='+tokenIdNumber
                           }



                           console.log('learned', nameData)
                           if(personalNames.length< 35)
                           {
                               personalNames.push(nameData)
                           }


                         }

                       });

                       Vue.set(personalNamesList, 'list', personalNames)

    }

    async updateRecentNamesList()
    {


      var web3 = ethereumHelper.getWeb3Instance();

      var localMetamaskAddress = ethereumHelper.getConnectedAccountAddress();

       if(!web3) return;




      var env = 'mainnet'

      var nametagContract = ContractInterface.getNametagContract(web3,env)
      console.log('update names list', nametagContract)

      /*nametagContract.Transfer({from:'0x0000000000000000000000000000000000000000000000000000000000000000'}, { fromBlock: 0, toBlock: 'latest' }).get((error, eventResult) => {
            if (error)
              console.log('Error in myEvent event handler: ' + error);
            else
              console.log('myEvent: ' + JSON.stringify(eventResult.args));
          });*/

          var currentEthBlock = await ethereumHelper.getCurrentEthBlockNumber()



           const _CONTRACT_ADDRESS = "0x3c642be0bb6cb9151652b999b26d80155bcea7de"
           const _TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

           var recentNames = []

           await web3.eth.filter({
             fromBlock: (currentEthBlock-3000),
                 toBlock: currentEthBlock,
                 address: _CONTRACT_ADDRESS,
                 topics: [_TRANSFER_TOPIC, null],
           }, async function(error,result)  {

              var fromAddress = result.topics[1];
              var toAddress = result.topics[2];
              var tokenIdHex = result.topics[3];
              var tokenIdNumber =  new BigNumber(tokenIdHex).toFixed();


          //    var tokenName = await nametagContract.tokenURI.call( )

              var tokenName =  await new Promise(function (result,error) {
                 nametagContract.tokenURI.call(tokenIdNumber, function(err,res){
                    if(err){ return error(err)}

                    result(res);
                 })
               });



              if(fromAddress == '0x0000000000000000000000000000000000000000000000000000000000000000')
              {
                var nameData = {
                  to:  toAddress,
                  tokenIdHex: tokenIdHex,
                  tokenIdNumber: tokenIdNumber,
                  tokenName: tokenName,
                  tokenURL: 'https://etherscan.io/token/'+_CONTRACT_ADDRESS+'?a='+tokenIdNumber
                }



                console.log('learned', nameData)
                if(recentNames.length< 25)
                {
                    recentNames.push(nameData)
                }


              }

            });

      Vue.set(recentNamesList, 'list', recentNames)


    }

     update(renderData)
    {



    }



}
