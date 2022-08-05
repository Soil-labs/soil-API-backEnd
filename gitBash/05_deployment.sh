OUTPUT=$(git rev-parse --abbrev-ref HEAD)
echo "${OUTPUT}"


echo "What message you want to commit | If you dont want to write a message just type -> N"
read MESSAGE


if [[ $MESSAGE == "n" || $MESSAGE == "N" ]]; then
        MESSAGE=$OUTPUT
fi

echo "${MESSAGE}"


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

#  --------- Git --------
git add .
git commit -m "$MESSAGE"
git push -f origin $OUTPUT
#  --------- Git --------


#  --------- Heroku --------
git add .
git commit -m "$MESSAGE"
git push -f heroku $OUTPUT:main
#  --------- Heroku --------


heroku logs --tail 


