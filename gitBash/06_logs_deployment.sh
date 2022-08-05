


echo "Type T -> for Soil-test-backend -> Develompent ||  Type O -> for oasis -> Deployment Test env  || Type D -> for eden-deploy ->Production"
read input
if [[ $input == "D" || $input == "d" ]]; then
        echo "D -> for eden-deploy ->Production"
        heroku git:remote -a "eden-deploy"
fi

if [[ $input == "O" || $input == "o" ]]; then
        echo "O -> for oasis -> Deployment Test env"
        heroku git:remote -a "oasis-bot-test-deploy"
fi

if [[ $input == "T" || $input == "t" ]]; then
        echo "T -> for Soil-test-backend -> Develompent "
        heroku git:remote -a "soil-test-backend"
fi


heroku logs --tail 


